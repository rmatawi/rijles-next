// components/ReferralShareSheet.jsx
import React, { useEffect, useState } from "react";
import {
  Sheet,
  PageContent,
  BlockTitle,
  List,
  ListItem,
  Button,
  Block,
  f7,
} from "framework7-react";
import { IonIcon } from "@ionic/react";
import {
  logoWhatsapp,
  logoFacebook,
  mail,
  chatbubbleOutline,
  copyOutline,
  shareOutline,
  qrCodeOutline,
} from "ionicons/icons";
import { shareTemplates } from "../services/referralService";
import { instructorService } from "../services/instructorService";
import { adminService } from "../services/adminService";
import QRCode from "qrcode";
import { getLayout } from "../js/utils";
import { openExternalUrl } from "../utils/externalLinks";

/**
 * ReferralShareSheet Component
 * Bottom sheet for sharing referral code through various channels:
 * - WhatsApp
 * - Facebook
 * - SMS
 * - Email
 * - Copy Link
 * - QR Code
 * - Native Share API (if available)
 */
const ReferralShareSheet = ({ referralCode, schoolName, studentName, schoolId }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [adminRef, setAdminRef] = useState("");
  const canShareReferral = Boolean(referralCode);

  useEffect(() => {
    let cancelled = false;

    const loadAdminRef = async () => {
      try {
        const { adminId } = await instructorService.resolveAdminIdForFlow({
          schoolId,
          prioritizeCurrentAdmin: false,
          includeExplicitInstructor: true,
          includeEnvFallback: true,
        });

        if (!adminId || cancelled) return;

        const { data: adminData } = await adminService.getAdminById(adminId);
        const alias = String(adminData?.alias || "").trim().replace(/^@+/, "");
        const finalRef = alias || adminId;

        if (!cancelled) {
          setAdminRef(finalRef);
        }
      } catch (error) {
        console.warn("Failed to resolve admin ref for student referral share:", error);
      }
    };

    loadAdminRef();

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  // Generate share link
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    if (adminRef) params.set("admin", adminRef);
    params.set("invite", "true");
    params.set("ref", referralCode || "");
    return `${baseUrl}/?${params.toString()}`;
  };

  const shareLink = generateShareLink();
  const requireReferralCode = () => {
    if (canShareReferral) return true;
    f7.dialog.alert("Referral code wordt nog geladen. Probeer opnieuw.");
    return false;
  };

  // Share via WhatsApp
  const shareWhatsApp = () => {
    if (!requireReferralCode()) return;
    const message = shareTemplates.whatsapp(schoolName, referralCode, shareLink);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    openExternalUrl(whatsappUrl);
    f7.sheet.close(".referral-share-sheet");
  };

  // Share via Facebook
  const shareFacebook = () => {
    if (!requireReferralCode()) return;
    const message = shareTemplates.facebook(schoolName, shareLink);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareLink
    )}&quote=${encodeURIComponent(message)}`;
    openExternalUrl(facebookUrl);
    f7.sheet.close(".referral-share-sheet");
  };

  // Share via SMS
  const shareSMS = () => {
    if (!requireReferralCode()) return;
    const message = shareTemplates.sms(schoolName, referralCode, shareLink);
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
    f7.sheet.close(".referral-share-sheet");
  };

  // Share via Email
  const shareEmail = () => {
    if (!requireReferralCode()) return;
    const emailData = shareTemplates.email(
      schoolName,
      referralCode,
      shareLink,
      studentName || "A friend"
    );
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(
      emailData.subject
    )}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoUrl;
    f7.sheet.close(".referral-share-sheet");
  };

  // Copy link to clipboard
  const copyLink = () => {
    if (!requireReferralCode()) return;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        f7.toast
          .create({
            text: "Link copied to clipboard!",
            closeTimeout: 2000,
            position: "center",
            icon: '<i class="icon f7-icons">checkmark_alt</i>',
          })
          .open();
        f7.sheet.close(".referral-share-sheet");
      })
      .catch((err) => {
        console.error("Error copying link:", err);
        f7.dialog.alert("Could not copy link. Please try again.");
      });
  };

  // Generate and show QR Code
  const showQRCode = async () => {
    if (!requireReferralCode()) return;
    try {
      const qrUrl = await QRCode.toDataURL(shareLink, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrUrl);

      f7.dialog.create({
        title: "Scan QR Code",
        content: `
          <div style="text-align: center; padding: 16px;">
            <img src="${qrUrl}" alt="QR Code" style="max-width: 100%; height: auto;" />
            <p style="margin-top: 16px; font-size: 14px; color: #666;">
              Share this QR code for easy scanning
            </p>
            <p style="margin-top: 8px; font-weight: bold; font-size: 16px; letter-spacing: 2px;">
              ${referralCode}
            </p>
          </div>
        `,
        buttons: [
          {
            text: "Download QR",
            onClick: () => {
              const link = document.createElement("a");
              link.download = `referral-qr-${referralCode}.png`;
              link.href = qrUrl;
              link.click();
            },
          },
          {
            text: "Close",
          },
        ],
      }).open();
    } catch (error) {
      console.error("Error generating QR code:", error);
      f7.dialog.alert("Could not generate QR code. Please try again.");
    }
  };

  // Native share API (if available)
  const shareNative = async () => {
    if (!requireReferralCode()) return;
    if (!navigator.share) {
      f7.dialog.alert(
        "Sharing is not supported on this device. Please use one of the other options."
      );
      return;
    }

    try {
      await navigator.share({
        title: `Join ${schoolName}!`,
        text: shareTemplates.generic(schoolName, referralCode, shareLink),
        url: shareLink,
      });
      f7.sheet.close(".referral-share-sheet");
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <Sheet
      className="referral-share-sheet"
      style={{ height: "auto", "--f7-sheet-bg-color": "#fff" }}
      swipeToClose
      backdrop
    >
      <PageContent>
        <Block className="text-align-center margin-top">
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Share Your Referral
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            Code: <strong>{referralCode || "..."}</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            Invite friends to earn rewards!
          </div>
        </Block>

        <BlockTitle medium>Share Via</BlockTitle>
        <List strong inset>
          {/* WhatsApp */}
          <ListItem link={canShareReferral ? "#" : false} onClick={shareWhatsApp}>
            <IonIcon
              icon={logoWhatsapp}
              slot="media"
              style={{ color: "#25D366", fontSize: "28px" }}
            />
            <div slot="title">WhatsApp</div>
            <div slot="text">Share via WhatsApp</div>
          </ListItem>

          {/* Facebook */}
          <ListItem link={canShareReferral ? "#" : false} onClick={shareFacebook}>
            <IonIcon
              icon={logoFacebook}
              slot="media"
              style={{ color: "#1877F2", fontSize: "28px" }}
            />
            <div slot="title">Facebook</div>
            <div slot="text">Share on Facebook</div>
          </ListItem>

          {/* SMS */}
          <ListItem link={canShareReferral ? "#" : false} onClick={shareSMS}>
            <IonIcon
              icon={chatbubbleOutline}
              slot="media"
              style={{ color: "var(--app-primary-color)", fontSize: "28px" }}
            />
            <div slot="title">SMS</div>
            <div slot="text">Send via text message</div>
          </ListItem>

          {/* Email */}
          <ListItem link={canShareReferral ? "#" : false} onClick={shareEmail}>
            <IonIcon
              icon={mail}
              slot="media"
              style={{ color: getLayout()?.colorScheme?.[0], fontSize: "28px" }}
            />
            <div slot="title">Email</div>
            <div slot="text">Share via email</div>
          </ListItem>
        </List>

        <BlockTitle medium>More Options</BlockTitle>
        <List strong inset>
          {/* Copy Link */}
          <ListItem link={canShareReferral ? "#" : false} onClick={copyLink}>
            <IonIcon
              icon={copyOutline}
              slot="media"
              style={{ fontSize: "28px" }}
            />
            <div slot="title">Copy Link</div>
            <div slot="text">Copy referral link to clipboard</div>
          </ListItem>

          {/* QR Code */}
          <ListItem link={canShareReferral ? "#" : false} onClick={showQRCode}>
            <IonIcon
              icon={qrCodeOutline}
              slot="media"
              style={{ fontSize: "28px" }}
            />
            <div slot="title">QR Code</div>
            <div slot="text">Generate QR code for easy scanning</div>
          </ListItem>

          {/* Native Share (if available) */}
          {navigator.share && (
            <ListItem link={canShareReferral ? "#" : false} onClick={shareNative}>
              <IonIcon
                icon={shareOutline}
                slot="media"
                style={{ fontSize: "28px" }}
              />
              <div slot="title">More Options</div>
              <div slot="text">Use device share menu</div>
            </ListItem>
          )}
        </List>

        <Block>
          <Button
            large
            fill
            round
            onClick={() => f7.sheet.close(".referral-share-sheet")}
          >
            Close
          </Button>
        </Block>
      </PageContent>
    </Sheet>
  );
};

export default ReferralShareSheet;
