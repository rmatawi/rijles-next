// src/services/referralService.js
import { SUPABASE_CONFIG } from "./supabase";

/**
 * Referral Service
 * Handles all referral-related operations including:
 * - Generating referral codes
 * - Tracking referrals
 * - Calculating and distributing rewards
 * - Retrieving referral statistics and leaderboards
 */
export const referralService = {
  /**
   * Generate a unique referral code for a student
   * @param {string} studentId - UUID of the student
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: object, error: any}>}
   */
  async generateReferralCode(studentId, schoolId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Generate a simple unique code (you can make this more sophisticated)
      const code = await this._generateUniqueCode(studentId, schoolId);

      // Create referral record with generated code
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_referrals`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          referrer_student_id: studentId,
          school_id: schoolId,
          referral_code: code,
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error generating referral code:", error);
      return { data: null, error };
    }
  },

  /**
   * Track a referral when a new student signs up using a code
   * @param {string} referralCode - The referral code used
   * @param {string} newStudentId - UUID of the newly registered student
   * @returns {Promise<{data: object, error: any}>}
   */
  async trackReferral(referralCode, newStudentId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Update the referral record with the new student and mark as completed
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referral_code=eq.${referralCode}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            referred_student_id: newStudentId,
            status: "completed",
            completed_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const referral =
        Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Check if student earned any rewards and distribute them
      if (referral && referral.referrer_student_id) {
        await this._checkAndDistributeRewards(referral.referrer_student_id);
      }

      return { data: referral, error: null };
    } catch (error) {
      console.error("Error tracking referral:", error);
      return { data: null, error };
    }
  },

  /**
   * Calculate rewards for a student based on their referral count
   * @param {string} studentId - UUID of the student
   * @returns {Promise<{data: object, error: any}>}
   */
  async calculateRewards(studentId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get completed referrals count
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referrer_student_id=eq.${studentId}&status=eq.completed&select=count`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            Prefer: "count=exact",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const countHeader = response.headers.get("content-range");
      const completedReferrals = countHeader
        ? parseInt(countHeader.split("/")[1])
        : 0;

      // Calculate rewards based on milestones
      const rewards = this._calculateMilestoneRewards(completedReferrals);

      return { data: { completedReferrals, rewards }, error: null };
    } catch (error) {
      console.error("Error calculating rewards:", error);
      return { data: null, error };
    }
  },

  /**
   * Distribute a reward to a student
   * @param {string} studentId - UUID of the student
   * @param {string} rewardType - Type of reward
   * @param {string} referralId - UUID of the referral that triggered the reward
   * @returns {Promise<{data: object, error: any}>}
   */
  async distributeReward(studentId, rewardType, referralId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      const rewardValue = this._getRewardValue(rewardType);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referral_rewards`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            student_id: studentId,
            referral_id: referralId,
            reward_type: rewardType,
            reward_value: rewardValue,
            redeemed: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const reward = Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Automatically redeem time extension rewards
      if (rewardType.startsWith("time_extension") && reward.id) {
        try {
          await this.redeemReferralReward(reward.id);
          console.log(`Auto-redeemed reward ${reward.id} for student ${studentId}`);
        } catch (redeemError) {
          console.error("Error auto-redeeming reward:", redeemError);
          // Don't fail the distribution if redemption fails
          // Reward can be redeemed manually later
        }
      }

      return {
        data: reward,
        error: null,
      };
    } catch (error) {
      console.error("Error distributing reward:", error);
      return { data: null, error };
    }
  },

  /**
   * Get referral statistics for a student
   * @param {string} studentId - UUID of the student
   * @returns {Promise<{data: object, error: any}>}
   */
  async getReferralStats(studentId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get all referrals for this student
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referrer_student_id=eq.${studentId}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const referrals = await response.json();

      // Get rewards for this student
      const rewardsResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_referral_rewards?student_id=eq.${studentId}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!rewardsResponse.ok) {
        throw new Error(`HTTP error! Status: ${rewardsResponse.status}`);
      }

      const rewards = await rewardsResponse.json();

      // Calculate statistics
      const stats = {
        totalInvites: referrals.length,
        completedReferrals: referrals.filter((r) => r.status === "completed")
          .length,
        pendingReferrals: referrals.filter((r) => r.status === "pending")
          .length,
        totalRewards: rewards.length,
        redeemedRewards: rewards.filter((r) => r.redeemed).length,
        referrals: referrals,
        rewards: rewards,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      return { data: null, error };
    }
  },

  /**
   * Get leaderboard for a school or globally
   * @param {string} schoolId - UUID of the school (optional, null for global)
   * @param {string} timeframe - 'month', 'week', or 'alltime'
   * @param {number} limit - Number of top referrers to return
   * @returns {Promise<{data: array, error: any}>}
   */
  async getLeaderboard(schoolId = null, timeframe = "month", limit = 10) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Calculate date filter based on timeframe
      let dateFilter = "";
      if (timeframe === "month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        dateFilter = `&completed_at=gte.${oneMonthAgo.toISOString()}`;
      } else if (timeframe === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        dateFilter = `&completed_at=gte.${oneWeekAgo.toISOString()}`;
      }

      // Build school filter
      const schoolFilter = schoolId ? `&school_id=eq.${schoolId}` : "";

      // Get referrals with student info
      // Use !fk_referrer to specify which foreign key constraint to use for the join
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?status=eq.completed${schoolFilter}${dateFilter}&select=referrer_student_id,drv_students!fk_referrer(id,name,email)`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const referrals = await response.json();

      // Aggregate referrals by student
      const referrerCounts = {};
      referrals.forEach((referral) => {
        const studentId = referral.referrer_student_id;
        if (!referrerCounts[studentId]) {
          referrerCounts[studentId] = {
            studentId: studentId,
            name: referral.drv_students?.name || "Unknown",
            email: referral.drv_students?.email || "",
            count: 0,
          };
        }
        referrerCounts[studentId].count++;
      });

      // Convert to array and sort
      const leaderboard = Object.values(referrerCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return { data: leaderboard, error: null };
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return { data: null, error };
    }
  },

  /**
   * Get referral by code
   * @param {string} code - The referral code
   * @returns {Promise<{data: object, error: any}>}
   */
  async getReferralByCode(code) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referral_code=eq.${code}&select=*,drv_schools!fk_school(name,logo_url),drv_students!fk_referrer(name)`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const referral =
        Array.isArray(data) && data.length > 0 ? data[0] : null;

      return { data: referral, error: null };
    } catch (error) {
      console.error("Error getting referral by code:", error);
      return { data: null, error };
    }
  },

  /**
   * Get or create referral code for a student
   * @param {string} studentId - UUID of the student
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: object, error: any}>}
   */
  async getOrCreateReferralCode(studentId, schoolId) {
    try {
      // First, check if student already has a referral code for this school
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referrer_student_id=eq.${studentId}&school_id=eq.${schoolId}&order=created_at.desc&limit=1&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Return existing code
        return { data: data[0], error: null };
      }

      // Generate new code if none exists
      return await this.generateReferralCode(studentId, schoolId);
    } catch (error) {
      console.error("Error getting or creating referral code:", error);
      return { data: null, error };
    }
  },

  // ==================== ADMIN METHODS ====================

  /**
   * Get school-wide referral statistics (Admin only)
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: object, error: any}>}
   */
  async getSchoolReferralStats(schoolId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get all referrals for this school
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?school_id=eq.${schoolId}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const referrals = await response.json();

      // Calculate statistics
      const stats = {
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter((r) => r.status === "completed")
          .length,
        pendingReferrals: referrals.filter((r) => r.status === "pending")
          .length,
        rewardedReferrals: referrals.filter((r) => r.status === "rewarded")
          .length,
        uniqueReferrers: new Set(referrals.map((r) => r.referrer_student_id))
          .size,
        conversionRate:
          referrals.length > 0
            ? (
                (referrals.filter((r) => r.status === "completed").length /
                  referrals.length) *
                100
              ).toFixed(1)
            : 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error getting school referral stats:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all referrals for a school with student details (Admin only)
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: array, error: any}>}
   */
  async getSchoolReferrals(schoolId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get referrals with both referrer and referred student info
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?school_id=eq.${schoolId}&select=*,drv_students!fk_referrer(id,name,email),referred:drv_students!fk_referred(id,name,email)&order=created_at.desc`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const referrals = await response.json();
      return { data: referrals, error: null };
    } catch (error) {
      console.error("Error getting school referrals:", error);
      return { data: null, error };
    }
  },

  /**
   * Get referral stats by student for a school (Admin only)
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: array, error: any}>}
   */
  async getSchoolStudentReferralStats(schoolId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get all referrals for this school with student info
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?school_id=eq.${schoolId}&select=referrer_student_id,status,referral_code,drv_students!fk_referrer(id,name,email)`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const referrals = await response.json();

      // Aggregate by student
      const studentStats = {};
      referrals.forEach((referral) => {
        const studentId = referral.referrer_student_id;
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            studentId: studentId,
            name: referral.drv_students?.name || "Unknown",
            email: referral.drv_students?.email || "",
            referralCode: referral.referral_code,
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
          };
        }
        studentStats[studentId].totalReferrals++;
        if (referral.status === "completed") {
          studentStats[studentId].completedReferrals++;
        } else if (referral.status === "pending") {
          studentStats[studentId].pendingReferrals++;
        }
      });

      // Convert to array and sort by total referrals
      const statsArray = Object.values(studentStats).sort(
        (a, b) => b.completedReferrals - a.completedReferrals
      );

      return { data: statsArray, error: null };
    } catch (error) {
      console.error("Error getting school student referral stats:", error);
      return { data: null, error };
    }
  },

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Generate a unique referral code (private method)
   * @private
   */
  async _generateUniqueCode(studentId, schoolId) {
    // Create a simple 8-character code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing characters
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Check and distribute rewards based on milestone (private method)
   * @private
   */
  async _checkAndDistributeRewards(studentId) {
    try {
      const { data: rewardData } = await this.calculateRewards(studentId);

      if (!rewardData || !rewardData.rewards) {
        return;
      }

      // Get the latest completed referral for this student
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?referrer_student_id=eq.${studentId}&status=eq.completed&order=completed_at.desc&limit=1&select=id`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const latestReferralId = data[0]?.id;

      if (!latestReferralId) return;

      // Distribute rewards for each milestone reached
      for (const reward of rewardData.rewards) {
        await this.distributeReward(
          studentId,
          reward.rewardType,
          latestReferralId
        );
      }
    } catch (error) {
      console.error("Error checking and distributing rewards:", error);
    }
  },

  /**
   * Calculate milestone rewards based on referral count (private method)
   * @private
   */
  _calculateMilestoneRewards(completedReferrals) {
    const rewards = [];

    // Rewards structure - Time extensions based on referral milestones:
    // 3 referrals = 7 days extension
    // 5 referrals = 14 days extension
    // 10 referrals = 30 days extension

    if (completedReferrals >= 10 && completedReferrals % 10 === 0) {
      rewards.push({
        milestone: 10,
        rewardType: "time_extension_30",
        description: "30 dagen gratis verlenging",
      });
    }

    if (completedReferrals === 5) {
      rewards.push({
        milestone: 5,
        rewardType: "time_extension_14",
        description: "14 dagen gratis verlenging",
      });
    }

    if (completedReferrals === 3) {
      rewards.push({
        milestone: 3,
        rewardType: "time_extension_7",
        description: "7 dagen gratis verlenging",
      });
    }

    return rewards;
  },

  /**
   * Get reward value based on reward type (private method)
   * @private
   */
  _getRewardValue(rewardType) {
    const rewardValues = {
      time_extension_7: { days: 7, description: "7 dagen gratis verlenging" },
      time_extension_14: { days: 14, description: "14 dagen gratis verlenging" },
      time_extension_30: { days: 30, description: "30 dagen gratis verlenging" },
      // Legacy reward types (kept for backward compatibility)
      time_extension: { days: 30, description: "30 dagen gratis verlenging" },
      premium_unlock: {
        features: ["advanced_practice", "mock_exams", "analytics"],
        description: "Premium features unlocked",
      },
      lesson_credit: {
        credits: 1,
        description: "1 free practical lesson",
      },
      badge: { type: "top_referrer", description: "Top Referrer Badge" },
    };

    return rewardValues[rewardType] || {};
  },

  // ==================== SUBSCRIPTION EXTENSION METHODS ====================

  /**
   * Extend subscription with tracking (calls database function)
   * @param {string} subscriptionId - UUID of the subscription
   * @param {number} days - Number of days to add
   * @param {string} source - Source of extension ('payment', 'referral', 'trial')
   * @param {string} referenceId - Reference ID (payment_id or reward_id)
   * @returns {Promise<{data: object, error: any}>}
   */
  async extendSubscription(subscriptionId, days, source, referenceId = null) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Call the database function
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/extend_subscription`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            p_subscription_id: subscriptionId,
            p_days: days,
            p_source: source,
            p_reference_id: referenceId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error extending subscription:", error);
      return { data: null, error };
    }
  },

  /**
   * Get or create subscription for a student at a school
   * @param {string} studentId - UUID of the student
   * @param {string} schoolId - UUID of the school
   * @returns {Promise<{data: object, error: any}>}
   */
  async getOrCreateSubscription(studentId, schoolId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Check if subscription exists
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_subscriptions?student_id=eq.${studentId}&school_id=eq.${schoolId}&select=*&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Supabase error response:", errorBody);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorBody}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return { data: data[0], error: null };
      }

      // Create new subscription if none exists
      const createResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_subscriptions`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            student_id: studentId,
            school_id: schoolId,
            plan_type: "basic",
            status: "active",
            start_date: new Date().toISOString().split("T")[0],
            access_source: "none",
            paid_days: 0,
            earned_days: 0,
          }),
        }
      );

      if (!createResponse.ok) {
        const errorBody = await createResponse.text();
        console.error("Supabase create error response:", errorBody);
        throw new Error(`HTTP error! Status: ${createResponse.status}, Details: ${errorBody}`);
      }

      const newData = await createResponse.json();
      return {
        data: Array.isArray(newData) && newData.length > 0 ? newData[0] : newData,
        error: null,
      };
    } catch (error) {
      console.error("Error getting or creating subscription:", error);
      return { data: null, error };
    }
  },

  /**
   * Redeem a referral reward and extend subscription
   * @param {string} rewardId - UUID of the reward to redeem
   * @returns {Promise<{data: object, error: any}>}
   */
  async redeemReferralReward(rewardId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      // Get the reward details
      const rewardResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_referral_rewards?id=eq.${rewardId}&select=*&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!rewardResponse.ok) {
        throw new Error(`HTTP error! Status: ${rewardResponse.status}`);
      }

      const rewards = await rewardResponse.json();
      const reward = rewards[0];

      if (!reward) {
        return { data: null, error: new Error("Reward not found") };
      }

      if (reward.redeemed) {
        return {
          data: null,
          error: new Error("Reward already redeemed"),
        };
      }

      // Get the reward value (number of days)
      const rewardValue = this._getRewardValue(reward.reward_type);
      const days = rewardValue.days || 0;

      if (days === 0) {
        // Non-time-extension reward, just mark as redeemed
        await fetch(`${supabaseUrl}/rest/v1/drv_referral_rewards?id=eq.${rewardId}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            redeemed: true,
            redeemed_at: new Date().toISOString(),
          }),
        });
        return { data: { message: "Reward redeemed" }, error: null };
      }

      // Get referral to find school_id
      const referralResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_referrals?id=eq.${reward.referral_id}&select=school_id&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!referralResponse.ok) {
        throw new Error("Failed to get referral school");
      }

      const referrals = await referralResponse.json();
      const schoolId = referrals[0]?.school_id;

      if (!schoolId) {
        return { data: null, error: new Error("School not found for referral") };
      }

      // Get or create subscription
      const { data: subscription, error: subError } =
        await this.getOrCreateSubscription(reward.student_id, schoolId);

      if (subError || !subscription) {
        return { data: null, error: subError || new Error("Failed to get subscription") };
      }

      // Extend the subscription
      const { data: extensionResult, error: extError } =
        await this.extendSubscription(
          subscription.id,
          days,
          "referral",
          rewardId
        );

      if (extError) {
        return { data: null, error: extError };
      }

      // Mark reward as redeemed
      await fetch(`${supabaseUrl}/rest/v1/drv_referral_rewards?id=eq.${rewardId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          redeemed: true,
          redeemed_at: new Date().toISOString(),
        }),
      });

      return {
        data: {
          message: `Subscription extended by ${days} days`,
          extensionResult,
          rewardRedeemed: true,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error redeeming referral reward:", error);
      return { data: null, error };
    }
  },

  /**
   * Get subscription breakdown for a student
   * @param {string} subscriptionId - UUID of the subscription
   * @returns {Promise<{data: object, error: any}>}
   */
  async getSubscriptionBreakdown(subscriptionId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_subscription_breakdown`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            p_subscription_id: subscriptionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error getting subscription breakdown:", error);
      return { data: null, error };
    }
  },
};

/**
 * Share templates for different platforms
 */
export const shareTemplates = {
  _schoolLabel: (schoolName) =>
    process.env.VITE_REACT_APP_TITLE || schoolName || "Rijles Suriname",
  /**
   * Generate WhatsApp share message
   */
  whatsapp: (schoolName, code, link) =>
    `Hey! Ik leer rijden bij Rijschool ${shareTemplates._schoolLabel(schoolName)}! Hun app is super handig - oefenexamens, verkeersborden, alles erop en eraan. ${link}`,

  /**
   * Generate Facebook share message
   */
  facebook: (schoolName, link) =>
    `Just aced another practice test on the ${schoolName} driving app! 🎉 If you're learning to drive, check this out: ${link}`,

  /**
   * Generate generic share message
   */
  generic: (schoolName, code, link) =>
    `Join me on ${schoolName}'s driving school app! Use code ${code}: ${link}`,

  /**
   * Generate SMS share message
   */
  sms: (schoolName, code, link) =>
    `Hey! Check out ${schoolName}'s driving school app. Use my referral code ${code} to sign up: ${link}`,

  /**
   * Generate email share message
   */
  email: (schoolName, code, link, referrerName) => ({
    subject: `${referrerName} invited you to ${schoolName}`,
    body: `Hi!\n\n${referrerName} has invited you to join ${schoolName}'s driving school app.\n\nThe app includes practice tests, traffic signs, theory lessons, and much more to help you pass your driving exam!\n\nUse referral code: ${code}\nSign up here: ${link}\n\nHappy learning!`,
  }),
};

