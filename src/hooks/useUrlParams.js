import { useEffect } from "react";
import { f7 } from "framework7-react";
import store from "../js/store";
import { shareUrlService } from "../services/shareUrlService";
import { openWhatsAppWithPhone } from "../services/adminContactService";
import { getAdminAccessWhatsAppNumber } from "../utils/contactTargets";
import { isUserAdmin } from "../js/utils";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { instructorService } from "../services/instructorService";

/**
 * Clean URL parameters that have been processed
 * @param {string[]} paramsToRemove - Array of parameter names to remove from URL
 */
const cleanUrlParameters = (paramsToRemove) => {
  const urlParams = new URLSearchParams(window.location.search);
  let shouldUpdate = false;

  paramsToRemove.forEach(param => {
    if (urlParams.has(param)) {
      urlParams.delete(param);
      shouldUpdate = true;
    }
  });

  if (shouldUpdate) {
    const newUrl = urlParams.toString()
      ? `${window.location.pathname}?${urlParams.toString()}`
      : window.location.pathname;

    // Use replaceState to update URL without adding to history
    window.history.replaceState({}, "", newUrl);
    console.log("[URL Cleanup] Removed parameters from URL:", paramsToRemove);
  }
};

const useUrlParams = () => {
  useEffect(() => {
    // Check for name parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlName = urlParams.get("name");
    const isInvite = urlParams.get("invite") === "true";

    const storedUserData = localStorage.getItem("userProfile");
    if (urlName) {
      // Use name from URL parameter
      const newUserData = {
        name: urlName,
        email: "",
        phone: "",
        memberSince: "",
        avatar: "",
      };
      localStorage.setItem("userProfile", JSON.stringify(newUserData));
      store.dispatch("updateUserProfile", { name: urlName });
    } else if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      store.dispatch("updateUserProfile", { name: parsedData.name });
    } else {
      // Use default name instead of prompting
      const newUserData = {
        name: "",
        email: "",
        phone: "",
        memberSince: "",
        avatar: "",
      };
      localStorage.setItem("userProfile", JSON.stringify(newUserData));
      store.dispatch("updateUserProfile", { name: "" });
    }

    // Store invite parameters if present
    if (isInvite) {
      localStorage.setItem("isInvite", "true");
    }

    // Capture admin/instructor reference from URL (supports admin_id/admin and alias links)
    instructorService
      .setInstructorFromUrl(instructorService.extractAdminRefFromUrl().value)
      .catch((error) => {
        console.warn("[URL Params] Failed to resolve admin from URL:", error);
      });

    // Check for signup hints in localStorage
    const newAdmin = localStorage.getItem("newAdmin");
    const newSchool = localStorage.getItem("newSchool");

    // If it's a new signup and no access request has been sent yet, show dialog
    if (newAdmin === "true" && newSchool) {
      // Check if admin request has already been sent by checking for pending/approved status
      const authUser = store.state.authUser;
      const adminStatus = authUser?.admin_status;
      const isAdmin = isUserAdmin(authUser);

      // Only show dialog if user is not already an admin and no request has been sent
      if (
        !isAdmin &&
        adminStatus !== "pending" &&
        adminStatus !== "approved"
      ) {
        f7.dialog
          .create({
            title: "Admin Access",
            text: "You've signed up as an admin. Would you like to request admin access via WhatsApp?",
            verticalButtons: true,
            buttons: [
              {
                text: "Cancel",
                color: "gray",
              },
              {
                text: "Request Admin Access via WhatsApp",
                color: "green",
                onClick: () => {
                  // Create WhatsApp link to send approval request with the specific link format
                  const domain = window.location.origin;
                  const approvalLink = buildAbsolutePageUrl(
                    "admin-access",
                    { email: store.state.authUser?.email || "" },
                    domain
                  );
                  const message =
                    `Admin access request for: ${
                      store.state.authUser?.email || "unknown"
                    } for school: ${newSchool}. Please approve access using this link: ${approvalLink}`;
                  const adminAccessPhone = getAdminAccessWhatsAppNumber();
                  openWhatsAppWithPhone({
                    phone: adminAccessPhone,
                    message,
                  });
                },
              },
            ],
          })
          .open();
      }
    }

    // Clean up processed URL parameters after a short delay to allow processing
    setTimeout(() => {
      const paramsToClean = [];
      const currentUrlParams = new URLSearchParams(window.location.search);

      // Clean up admin parameters if they were processed
      if (currentUrlParams.has("admin_id")) paramsToClean.push("admin_id");
      if (currentUrlParams.has("admin")) paramsToClean.push("admin");
      if (currentUrlParams.has("adminid")) paramsToClean.push("adminid");
      if (currentUrlParams.has("admin-id")) paramsToClean.push("admin-id");

      if (paramsToClean.length > 0) {
        cleanUrlParameters(paramsToClean);
      }
    }, 2000); // Wait 2 seconds for processing to complete
  }, []);
};

export default useUrlParams;
