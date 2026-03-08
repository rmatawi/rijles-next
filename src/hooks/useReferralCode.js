import { useEffect } from "react";
import store from "../js/store";

const useReferralCode = () => {
  useEffect(() => {
    // Check for referral code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get("ref"); // Check for referral code

    // Process referral code if present
    if (referralCode) {
      // Store the referral code in localStorage for later use
      localStorage.setItem("referralCode", referralCode);

      // If user is already authenticated, try to link them immediately
      if (store.state.authUser?.email) {
        // Import accountManagerService to handle the referral linking
        import("../services").then(({ accountManagerService }) => {
          accountManagerService
            .linkAdminToAccountManager(
              referralCode,
              store.state.authUser.email
            )
            .then((result) => {
              if (result.success) {
                console.log(
                  "Successfully linked to account manager via referral code:",
                  result
                );
              } else {
                console.error(
                  "Error linking to account manager:",
                  result.error
                );
              }
            });
        });
      }
    }
  }, []);
};

export default useReferralCode;