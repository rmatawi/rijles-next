// utils/ReadingSpeedTracker.js - Reading speed and time tracking
export const ReadingSpeedTracker = {
  // Get reading sessions for a book
  getSessions: (bookId) => {
    try {
      const stored = localStorage.getItem(`reading_sessions_${bookId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Error getting reading sessions:", error);
      return [];
    }
  },

  // Save reading sessions
  saveSessions: (bookId, sessions) => {
    try {
      localStorage.setItem(`reading_sessions_${bookId}`, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.warn("Error saving reading sessions:", error);
      return false;
    }
  },

  // Start a reading session
  startSession: (bookId, sectionId, sectionTitle, wordCount = 0) => {
    const sessions = ReadingSpeedTracker.getSessions(bookId);
    const newSession = {
      id: Date.now().toString(),
      sectionId,
      sectionTitle,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      wordCount,
      wordsPerMinute: 0,
      date: new Date().toISOString().split('T')[0]
    };

    sessions.push(newSession);
    ReadingSpeedTracker.saveSessions(bookId, sessions);
    return newSession;
  },

  // End a reading session
  endSession: (bookId, sessionId) => {
    const sessions = ReadingSpeedTracker.getSessions(bookId);
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      const endTime = Date.now();
      const duration = endTime - session.startTime;
      const minutes = duration / (1000 * 60);
      const wordsPerMinute = minutes > 0 ? Math.round(session.wordCount / minutes) : 0;

      sessions[sessionIndex] = {
        ...session,
        endTime,
        duration,
        wordsPerMinute
      };

      ReadingSpeedTracker.saveSessions(bookId, sessions);
      return sessions[sessionIndex];
    }
    return null;
  },

  // Get current active session
  getActiveSession: (bookId) => {
    const sessions = ReadingSpeedTracker.getSessions(bookId);
    return sessions.find(s => s.endTime === null);
  },

  // Calculate reading statistics
  getStats: (bookId) => {
    const sessions = ReadingSpeedTracker.getSessions(bookId);
    const completedSessions = sessions.filter(s => s.endTime !== null);

    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageWPM: 0,
        totalWords: 0,
        averageSessionTime: 0,
        dailyStats: [],
        weeklyGoal: { target: 300, current: 0 }, // 5 hours per week in minutes
        streak: 0
      };
    }

    const totalTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalWords = completedSessions.reduce((sum, s) => sum + s.wordCount, 0);
    const averageWPM = Math.round(
      completedSessions.reduce((sum, s) => sum + s.wordsPerMinute, 0) / completedSessions.length
    );

    // Calculate daily stats for the last 7 days
    const today = new Date();
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = completedSessions.filter(s => s.date === dateStr);
      const dayTime = daySessions.reduce((sum, s) => sum + s.duration, 0);
      const dayWords = daySessions.reduce((sum, s) => sum + s.wordCount, 0);

      dailyStats.push({
        date: dateStr,
        sessions: daySessions.length,
        timeMinutes: Math.round(dayTime / (1000 * 60)),
        words: dayWords,
        averageWPM: daySessions.length > 0 ? Math.round(
          daySessions.reduce((sum, s) => sum + s.wordsPerMinute, 0) / daySessions.length
        ) : 0
      });
    }

    // Calculate reading streak (consecutive days)
    let streak = 0;
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].sessions > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Weekly goal progress
    const weekTime = dailyStats.reduce((sum, day) => sum + day.timeMinutes, 0);

    return {
      totalSessions: completedSessions.length,
      totalTime: Math.round(totalTime / (1000 * 60)), // in minutes
      averageWPM,
      totalWords,
      averageSessionTime: Math.round(totalTime / completedSessions.length / (1000 * 60)),
      dailyStats,
      weeklyGoal: { target: 300, current: weekTime },
      streak,
      bestWPM: Math.max(...completedSessions.map(s => s.wordsPerMinute)),
      recentSessions: completedSessions.slice(-10).reverse()
    };
  },

  // Estimate word count for text
  estimateWordCount: (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  // Get reading level assessment
  getReadingLevel: (averageWPM) => {
    if (averageWPM < 100) return { level: 'Beginnend', color: 'red', description: 'Neem je tijd om te wennen aan lezen' };
    if (averageWPM < 200) return { level: 'Gemiddeld', color: 'orange', description: 'Goed leestempo voor studie' };
    if (averageWPM < 300) return { level: 'Goed', color: 'blue', description: 'Efficiënt leestempo' };
    if (averageWPM < 400) return { level: 'Uitstekend', color: 'green', description: 'Zeer snel lezer' };
    return { level: 'Meester', color: 'purple', description: 'Exceptioneel leestempo!' };
  },

  // Get motivation message based on stats
  getMotivationMessage: (stats) => {
    if (stats.streak >= 7) return "🔥 Geweldige leesreeks! Je bent op de goede weg!";
    if (stats.streak >= 3) return "📚 Mooi vol te houden! Blijf doorgaan!";
    if (stats.totalSessions >= 10) return "🎯 Lekker bezig met je leesoefening!";
    if (stats.averageWPM > 250) return "⚡ Impressante leessnelheid!";
    return "🌟 Elke minuut lezen telt! Blijf oefenen!";
  }
};