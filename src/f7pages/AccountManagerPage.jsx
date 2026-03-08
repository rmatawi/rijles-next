import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Button,
  Card,
  CardContent,
  Icon,
  List,
  ListInput,
  NavLeft,
  NavRight,
  NavTitle,
  Navbar,
  Page,
  f7,
} from "framework7-react";
import { useStore } from "framework7-react";
import { t } from "../i18n/translate";
import { accountManagerService } from "../services";
import { isUserAdmin } from "../js/utils";
import NavHomeButton from "../components/NavHomeButton";

const AccountManagerPage = () => {
  const [accountManager, setAccountManager] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAccountManager, setIsAccountManager] = useState(false);
  const [accountManagerRecord, setAccountManagerRecord] = useState(null);
  const [referralStats, setReferralStats] = useState(null);

  // Provide fallback values for authUser and currentUser if they are null/undefined
  const authUser = useStore("authUser");

  // Check admin status using authUser properties
  const isAdminResult = isUserAdmin(authUser);

  // Generate a referral code
  const generateReferralCode = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setAccountManager((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Initialize account manager data from Supabase
  useEffect(() => {
    const loadAccountManagerData = async () => {
      setLoading(true);
      try {
        // Check if the current user is an account manager
        if (authUser?.email) {
          const { data: accountManagerData, error } =
            await accountManagerService.getAccountManagerByEmail(
              authUser.email
            );

          if (error) {
            console.error("Error fetching account manager data:", error);
            // If there's an error, the user may not be an account manager yet
            setIsAccountManager(false);
            setAccountManager({
              name: authUser?.adminProfile?.name || "",
              email: authUser?.adminProfile?.email || "",
              phone: authUser?.adminProfile?.phone || "",
              address: authUser?.adminProfile?.address || "",
              status: "active",
            });
          } else if (accountManagerData) {
            // User is an account manager, load their data
            setIsAccountManager(true);
            setAccountManagerRecord(accountManagerData);
            setAccountManager({
              name: accountManagerData.name || "",
              email:
                accountManagerData.email || authUser?.adminProfile?.email || "",
              phone:
                accountManagerData.phone || authUser?.adminProfile?.phone || "",
              address:
                accountManagerData.address ||
                authUser?.adminProfile?.address ||
                "",
              status: accountManagerData.status || "active",
            });
            // Load referral code if needed (we'll generate a new one if needed)
            setReferralCode(accountManagerData.referral_code || "");

            // Load referral stats
            if (accountManagerData.id) {
              const statsResult =
                await accountManagerService.getAccountManagerStats(
                  accountManagerData.id
                );
              if (!statsResult.error) {
                setReferralStats(statsResult.data);
              } else {
                console.error(
                  "Error loading referral stats:",
                  statsResult.error
                );
              }
            }
          } else {
            // User is not an account manager yet
            setIsAccountManager(false);
            setAccountManager({
              name: authUser?.adminProfile?.name || "",
              email: authUser?.adminProfile?.email || "",
              phone: authUser?.adminProfile?.phone || "",
              address: authUser?.adminProfile?.address || "",
              status: "active",
            });
          }
        }
      } catch (error) {
        console.error("Error loading account manager data:", error);
        f7.toast.show({
          text: "Error loading account manager data: " + error.message,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdminResult) {
      loadAccountManagerData();
    }
  }, [isAdminResult, authUser, authUser]);

  // Save account manager profile to Supabase
  const saveProfile = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!accountManager.name.trim()) {
        throw new Error("Name is required");
      }
      if (!accountManager.email.trim()) {
        throw new Error("Email is required");
      }

      let result;
      if (isAccountManager && accountManagerRecord?.id) {
        // Update existing account manager
        result = await accountManagerService.updateAccountManager(
          accountManagerRecord.id,
          {
            ...accountManager,
            updated_at: new Date().toISOString(),
          }
        );
      } else {
        // Create new account manager
        result = await accountManagerService.createAccountManager({
          ...accountManager,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      f7.toast.show({
        text: "Account manager profile updated successfully!",
        position: "top",
      });

      // Update the account manager record with the new data
      if (!isAccountManager) {
        setIsAccountManager(true);
        setAccountManagerRecord(result.data);
      } else {
        setAccountManagerRecord((prev) => ({ ...prev, ...result.data }));
      }

      // Update the store with the new user data
      f7.store.dispatch("updateUserProfile", {
        name: accountManager.name,
        email: accountManager.email,
      });
    } catch (error) {
      console.error("Error saving account manager profile:", error);
      f7.toast.show({
        text: "Error saving profile: " + error.message,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update referral code in the account manager record
  const updateReferralCode = async (newReferralCode) => {
    if (!isAccountManager || !accountManagerRecord?.id) {
      f7.toast.show({
        text: "You must be an account manager to generate a referral code",
        position: "top",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await accountManagerService.updateAccountManager(
        accountManagerRecord.id,
        {
          ...accountManager,
          referral_code: newReferralCode, // This would require adding a referral_code column to the table
          updated_at: new Date().toISOString(),
        }
      );

      if (result.error) {
        throw new Error(result.error.message);
      }

      f7.toast.show({
        text: "Referral code updated successfully!",
        position: "top",
      });

      // Update the account manager record with the new data
      setAccountManagerRecord((prev) => ({
        ...prev,
        referral_code: newReferralCode,
        ...result.data,
      }));
      setReferralCode(newReferralCode);
    } catch (error) {
      console.error("Error updating referral code:", error);
      f7.toast.show({
        text: "Error updating referral code: " + error.message,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate and save a new referral code
  const generateAndSaveReferralCode = () => {
    const newReferralCode = generateReferralCode();
    updateReferralCode(newReferralCode);
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    let referralLink = `${window.location.origin}/?ref=${referralCode}&invite=true`;

    if (authUser?.id) {
      referralLink += `&admin_id=${authUser.id}`;
    }

    if (schoolId) {
      // No longer adding school param individually as it's handled by env
    }

    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        f7.toast.show({
          text: "Referral link copied to clipboard!",
          position: "top",
        });
      })
      .catch((err) => {
        console.error("Failed to copy referral link: ", err);
        f7.toast.show({
          text: "Failed to copy referral link",
          position: "top",
        });
      });
  };

  // Share referral link
  const shareReferralLink = () => {
    const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    let referralLink = `${window.location.origin}/?ref=${referralCode}&invite=true`;

    if (authUser?.id) {
      referralLink += `&admin_id=${authUser.id}`;
    }

    if (schoolId) {
      // No longer adding school param individually as it's handled by env
    }

    if (navigator.share) {
      navigator
        .share({
          title: "Rijles Account Manager Referral",
          text: "Join Rijles using my referral code!",
          url: referralLink,
        })
        .catch((error) => {
          console.error("Error sharing referral link:", error);
          copyReferralLink(); // Fallback to clipboard copy
        });
    } else {
      copyReferralLink(); // Fallback to clipboard copy
    }
  };

  // Check if user has permission to view this page
  if (!isAdminResult) {
    return (
      <Page name="account-manager">
        <Navbar>
          <NavLeft>
            <NavHomeButton />
          </NavLeft>
          <NavTitle>{t("accountManager.title")}</NavTitle>
        </Navbar>
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div>
              <p style={{ textAlign: "center" }}>{t("admin.noPermission")}</p>
            </div>
          </div>
        </Block>
      </Page>
    );
  }

  // Show loading state while loading data
  if (loading && !accountManager.email) {
    return (
      <Page name="account-manager">
        <Navbar>
          <NavLeft>
            <NavHomeButton />
          </NavLeft>
          <NavTitle>{t("accountManager.title")}</NavTitle>
        </Navbar>
        <Block>
          <div
            className="display-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <div className="preloader"></div>
          </div>
        </Block>
      </Page>
    );
  }

  return (
    <Page name="account-manager">
      <Navbar>
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle>{t("accountManager.title")}</NavTitle>
        <NavRight>
          <Button
            fill
            large
            onClick={saveProfile}
            color="green"
            disabled={loading}
          >
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </NavRight>
      </Navbar>

      <BlockTitle>{t("accountManager.profileInfo")}</BlockTitle>
      <Block>
        <List inset>
          <ListInput
            outline
            label={t("accountManager.fullName")}
            type="text"
            placeholder={t("accountManager.fullName")}
            value={accountManager.name}
            onInput={(e) => handleInputChange("name", e.target.value)}
            required
          >
            <Icon
              f7="person"
              size="24"
              className="text-color-blue"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("accountManager.email")}
            type="email"
            placeholder={t("accountManager.email")}
            value={accountManager.email}
            onInput={(e) => handleInputChange("email", e.target.value)}
          >
            <Icon
              f7="envelope"
              size="24"
              className="text-color-orange"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("accountManager.phone")}
            type="tel"
            placeholder={t("accountManager.phone")}
            value={accountManager.phone}
            onInput={(e) => handleInputChange("phone", e.target.value)}
          >
            <Icon
              f7="phone"
              size="24"
              className="text-color-green"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("accountManager.address")}
            type="text"
            placeholder={t("accountManager.address")}
            value={accountManager.address}
            onInput={(e) => handleInputChange("address", e.target.value)}
          >
            <Icon
              f7="location"
              size="24"
              className="text-color-red"
              slot="media"
            />
          </ListInput>

          <ListInput
            outline
            label={t("accountManager.status")}
            type="select"
            value={accountManager.status}
            onChange={(e) => handleInputChange("status", e.target.value)}
          >
            <option value="active">{t("accountManager.active")}</option>
            <option value="inactive">{t("accountManager.inactive")}</option>
          </ListInput>
        </List>
      </Block>

      <BlockTitle>{t("accountManager.referral")}</BlockTitle>
      <Block>
        <Card>
          <CardContent>
            <p>{t("accountManager.referralDescription")}</p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  {t("accountManager.referralCode")}:
                </p>
                <p style={{ margin: 0, fontSize: "1.2em", color: "var(--app-primary-color)" }}>
                  {referralCode || t("accountManager.noCodeGenerated")}
                </p>
              </div>

              <Button
                round
                fill
                color="blue"
                onClick={generateAndSaveReferralCode}
                disabled={loading}
                style={{ height: "40px", minWidth: "120px" }}
              >
                {loading
                  ? t("common.saving")
                  : t("accountManager.generateCode")}
              </Button>
            </div>

            {referralCode && (
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  fill
                  color="blue"
                  onClick={copyReferralLink}
                  style={{ flex: 1 }}
                >
                  {t("accountManager.copyLink")}
                </Button>
                <Button
                  fill
                  color="green"
                  onClick={shareReferralLink}
                  style={{ flex: 1 }}
                >
                  {t("accountManager.share")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Block>

      {isAccountManager && referralStats && (
        <>
          <BlockTitle>{t("accountManager.referralStats")}</BlockTitle>
          <Block>
            <Card>
              <CardContent>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "2em",
                        fontWeight: "bold",
                        color: "var(--app-primary-color)",
                      }}
                    >
                      {referralStats.referredAdminsCount || 0}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9em",
                        color: "var(--color-gray-medium)",
                      }}
                    >
                      {t("accountManager.referredAdmins")}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "2em",
                        fontWeight: "bold",
                        color: "#4cd964",
                      }}
                    >
                      {referralStats.accountManager ? 1 : 0}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9em",
                        color: "var(--color-gray-medium)",
                      }}
                    >
                      {t("accountManager.yourAccount")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Block>
        </>
      )}

      <BlockTitle>{t("accountManager.howItWorks")}</BlockTitle>
      <Block>
        <List mediaList>
          <ul>
            <li>
              <div className="item-content">
                <div className="item-media">
                  <Icon
                    f7="number_1_circle"
                    size="24"
                    className="text-color-blue"
                  />
                </div>
                <div className="item-inner">
                  <div className="item-title">
                    {t("accountManager.step1Title")}
                  </div>
                  <div className="item-after">
                    {t("accountManager.step1Desc")}
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="item-content">
                <div className="item-media">
                  <Icon
                    f7="number_2_circle"
                    size="24"
                    className="text-color-blue"
                  />
                </div>
                <div className="item-inner">
                  <div className="item-title">
                    {t("accountManager.step2Title")}
                  </div>
                  <div className="item-after">
                    {t("accountManager.step2Desc")}
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className="item-content">
                <div className="item-media">
                  <Icon
                    f7="number_3_circle"
                    size="24"
                    className="text-color-blue"
                  />
                </div>
                <div className="item-inner">
                  <div className="item-title">
                    {t("accountManager.step3Title")}
                  </div>
                  <div className="item-after">
                    {t("accountManager.step3Desc")}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </List>
      </Block>
    </Page>
  );
};

export default AccountManagerPage;
