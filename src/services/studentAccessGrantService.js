import { f7 } from "framework7-react";
import { accessTokenService } from "./accessTokenService";
import { studentService } from "./studentService";
import { studentSchoolService } from "./studentSchoolService";
import { normalizePhoneForWhatsApp } from "./adminContactService";
import { buildAbsolutePageUrl } from "../utils/appUrl";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "");
const generatePasscode = () => Math.floor(1000 + Math.random() * 9000).toString();
const generateVerificationKey = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

const formatStudentSubtitle = (student) => {
  const details = [student.phone, student.email].filter(Boolean);
  return details.join(" - ") || "Geen telefoonnummer";
};

const isStandalonePwa = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
};

const showWhatsAppLaunchDialog = ({
  title = "Open WhatsApp",
  description = "Klik op de knop hieronder om WhatsApp te openen.",
  whatsappUrl,
  whatsappFallbackUrl = "",
  buttonText = "Open WhatsApp",
} = {}) => {
  if (!whatsappUrl) {
    throw new Error("Geen WhatsApp-link beschikbaar.");
  }

  f7.dialog.create({
    title,
    text: description,
    content: `
      <div style="padding: 0 16px 16px;">
        <a
          href="${escapeHtml(whatsappUrl)}"
          target="${isStandalonePwa() ? "_self" : "_blank"}"
          rel="noopener noreferrer"
          class="button button-fill external"
          external=""
        >
          ${escapeHtml(buttonText)}
        </a>
        ${whatsappFallbackUrl
          ? `
        <a
          href="${escapeHtml(whatsappFallbackUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="button button-outline external"
          external=""
          style="margin-top: 12px;"
        >
          Open web fallback
        </a>
        `
          : ""}
      </div>
    `,
    buttons: [
      {
        text: "Sluiten",
      },
    ],
  }).open();
};

const buildWhatsAppUrl = ({ phone, message = "" } = {}) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone || "");
  if (!normalizedPhone) {
    throw new Error("Geen geldig telefoonnummer");
  }

  const encodedMessage = encodeURIComponent(message);

  return {
    appUrl: `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`,
    webUrl: `https://wa.me/${normalizedPhone}?text=${encodedMessage}`,
  };
};

const showAccessTokenDialog = async ({ schoolId, mode = "grant" } = {}) => {
  if (!schoolId) {
    throw new Error("Geen school geselecteerd voor uitnodiging");
  }
  const isCredentialsMode = mode === "studentCredentials";

  const { data: fetchedStudents, error: studentsError } =
    await studentService.getStudentsBySchoolId(schoolId);

  if (studentsError) {
    throw new Error(
      studentsError.message || "Fout bij ophalen van studentenlijst",
    );
  }

  const students = (Array.isArray(fetchedStudents) ? fetchedStudents : [])
    .filter((student) => student && !student.archived)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "nl"));

  return new Promise((resolve, reject) => {
    const instanceId = `student-access-grant-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const ids = {
      root: instanceId,
      search: `${instanceId}-search`,
      phone: `${instanceId}-phone`,
      list: `${instanceId}-list`,
      empty: `${instanceId}-empty`,
      visibleCount: `${instanceId}-visible-count`,
      cancel: `${instanceId}-cancel`,
      submit: `${instanceId}-submit`,
      durationWrap: `${instanceId}-duration`,
    };

    const studentItemsHtml =
      students.length > 0
        ? students
            .map((student) => {
              const phone = String(student.phone || "").trim();
              const isDisabled = !phone;
              const searchText = [
                student.name,
                student.phone,
                student.email,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return `
                <li
                  class="item-content item-link student-access-student-item${isDisabled ? " disabled" : ""}"
                  data-student-id="${escapeHtml(student.id || "")}"
                  data-student-name="${escapeHtml(student.name || "")}"
                  data-student-phone="${escapeHtml(phone)}"
                  data-student-email="${escapeHtml(student.email || "")}"
                  data-student-passcode="${escapeHtml(student.passcode || "")}"
                  data-search="${escapeHtml(searchText)}"
                  style="border-radius: 12px; margin: 4px 0;${isDisabled ? "opacity:0.55;" : ""}"
                >
                  <div class="item-media" style="align-self:flex-start;">
                    <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(var(--f7-theme-color-rgb),0.12);color:var(--f7-theme-color);font-weight:700;">
                      ${escapeHtml((student.name || "?").trim().charAt(0).toUpperCase() || "?")}
                    </div>
                  </div>
                  <div class="item-inner">
                    <div class="item-title-row">
                      <div class="item-title">${escapeHtml(student.name || "Onbekende student")}</div>
                    </div>
                    <div class="item-subtitle">${escapeHtml(formatStudentSubtitle(student))}</div>
                    ${isDisabled ? '<div class="item-text text-color-red" style="font-size:12px;">Geen telefoonnummer beschikbaar</div>' : ""}
                  </div>
                </li>
              `;
            })
            .join("")
        : "";

    const sheetContent = `
      <div id="${ids.root}" class="sheet-modal student-access-grant-sheet" style="height: 70vh;">
        <div class="page">
          <div class="navbar">
            <div class="navbar-bg"></div>
            <div class="navbar-inner sliding">
              <div class="title">${
                isCredentialsMode ? "Student Logingegevens" : "Toegang Verlenen"
              }</div>
              <div class="right">
                <div class="neu-btn-circle sheet-close" style="width: 36px; height: 36px; margin-right: 8px; cursor: pointer;">
                  <i class="icon f7-icons" style="font-size: 18px;">xmark</i>
                </div>
              </div>
            </div>
          </div>

          <div class="toolbar toolbar-bottom">
            <div class="toolbar-inner" style="padding: 0 12px; gap: 10px;">
              <a href="#" id="${ids.cancel}" class="link" style="color: #a55c58;">Cancel</a>
              <a
                href="#"
                id="${ids.submit}"
                class="link"
                style="
                  font-weight: 700;
                  color: #1f1f1f;
                "
              >
                Verzenden
              </a>
            </div>
          </div>

          <div class="page-content" style="padding-bottom: 74px;">
            <div class="block" style="margin-top: 12px; margin-bottom: 8px;">
              <p style="margin: 0; color: var(--f7-text-color-secondary);">
                ${
                  isCredentialsMode
                    ? "Kies een student om WhatsApp-logingegevens en de toegangslink voor het bestaande account te versturen."
                    : "Kies een student (of vul handmatig een nummer in) en selecteer de duur van toegang."
                }
              </p>
            </div>

            <div class="block" style="margin-top: 8px; margin-bottom: 8px;">
              <div class="searchbar" style="margin: 0;">
                <div class="searchbar-inner">
                  <div class="searchbar-input-wrap">
                    <input
                      type="search"
                      id="${ids.search}"
                      placeholder="Zoek student op naam, telefoon of e-mail"
                      autocomplete="off"
                    />
                    <i class="searchbar-icon"></i>
                  </div>
                </div>
              </div>
            </div>

            ${
              isCredentialsMode
                ? ""
                : `
            <div class="list no-hairlines-md" style="margin-top: 0; margin-bottom: 8px;">
              <ul>
                <li class="item-content item-input">
                  <div class="item-inner">
                    <div class="item-title item-label">Telefoonnummer</div>
                    <div class="item-input-wrap">
                      <input type="text" id="${ids.phone}" placeholder="Bijv. +59712345678" value="">
                    </div>
                  </div>
                </li>
                <li class="item-content">
                  <div class="item-inner" style="display: block;">
                    <div class="item-title item-label" style="margin-bottom: 8px;">Duur (dagen)</div>
                    <div class="item-input-wrap" style="width: 100%;">
                      <div class="segmented segmented-strong" id="${ids.durationWrap}">
                        <button type="button" class="button" data-duration="3">3</button>
                        <button type="button" class="button button-active" data-duration="7">7</button>
                        <button type="button" class="button" data-duration="30">30</button>
                        <button type="button" class="button" data-duration="90">90</button>
                        <span class="segmented-highlight"></span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            `
            }

            <div class="block-title" style="margin-top: 12px; margin-bottom: 6px;">
              Studenten <span id="${ids.visibleCount}" style="font-weight: 400; color: var(--f7-text-color-secondary);">(${students.length})</span>
            </div>

            <div class="list media-list inset strong dividers" style="margin-top: 0;">
              <ul id="${ids.list}" style="max-height: 28vh; overflow: auto;">
                ${studentItemsHtml || ""}
              </ul>
            </div>

            <div id="${ids.empty}" class="block text-align-center" style="display: ${students.length ? "none" : "block"}; color: var(--f7-text-color-secondary);">
              <i class="icon f7-icons" style="font-size: 28px; margin-bottom: 8px;">person_2_square_stack</i>
              <div style="font-size: 14px;">
                ${students.length ? "Geen studenten gevonden voor deze zoekopdracht." : "Geen studenten gevonden voor deze rijschool."}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    let settled = false;
    let sheet;
    let cleanup = () => {};

    const safeResolve = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const safeReject = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    sheet = f7.sheet.create({
      content: sheetContent,
      swipeToClose: true,
      backdrop: true,
      closeByBackdropClick: true,
      on: {
        opened: () => {
          const rootEl = document.getElementById(ids.root);
          if (!rootEl) return;

          const searchInput = document.getElementById(ids.search);
          const phoneInput = document.getElementById(ids.phone);
          const emptyEl = document.getElementById(ids.empty);
          const visibleCountEl = document.getElementById(ids.visibleCount);
          const durationWrap = document.getElementById(ids.durationWrap);
          const cancelBtn = document.getElementById(ids.cancel);
          const submitBtn = document.getElementById(ids.submit);

          const studentItems = Array.from(
            rootEl.querySelectorAll(".student-access-student-item"),
          );
          const durationButtons = durationWrap
            ? Array.from(durationWrap.querySelectorAll(".button"))
            : [];

          const setSelectedStudent = (itemEl) => {
            studentItems.forEach((item) => {
              item.classList.remove("color-theme-blue", "item-selected");
              item.style.backgroundColor = "";
              item.style.boxShadow = "";
            });
            if (itemEl) {
              itemEl.classList.add("color-theme-blue", "item-selected");
              itemEl.style.backgroundColor =
                "rgba(var(--f7-theme-color-rgb), 0.08)";
              itemEl.style.boxShadow =
                "inset 0 0 0 1px rgba(var(--f7-theme-color-rgb), 0.18)";
              if (phoneInput) {
                phoneInput.value =
                  itemEl.getAttribute("data-student-phone") || "";
              }
            }
          };

          const applySearch = () => {
            const term = String(searchInput?.value || "")
              .trim()
              .toLowerCase();
            let visibleCount = 0;

            studentItems.forEach((item) => {
              const haystack = item.getAttribute("data-search") || "";
              const matches = !term || haystack.includes(term);
              item.style.display = matches ? "" : "none";
              if (matches) visibleCount += 1;
            });

            if (visibleCountEl) {
              visibleCountEl.textContent = `(${visibleCount})`;
            }

            if (emptyEl) {
              const showEmpty = visibleCount === 0;
              emptyEl.style.display = showEmpty ? "block" : "none";
              const emptyText = emptyEl.querySelector("div");
              if (emptyText) {
                emptyText.textContent = term
                  ? "Geen studenten gevonden voor deze zoekopdracht."
                  : "Geen studenten gevonden voor deze rijschool.";
              }
            }
          };

          const onStudentClick = (event) => {
            const targetEl =
              typeof Element !== "undefined" && event.target instanceof Element
                ? event.target
                : null;
            const itemEl =
              targetEl?.closest(".student-access-student-item") ||
              (event.currentTarget instanceof Element
                ? event.currentTarget
                : null);
            if (!itemEl || itemEl.classList.contains("disabled")) return;
            setSelectedStudent(itemEl);
          };

          const onDurationClick = (event) => {
            const button = event.target.closest(".button");
            if (!button) return;
            durationButtons.forEach((btn) => btn.classList.remove("button-active"));
            button.classList.add("button-active");
          };

          const onCancel = (event) => {
            event.preventDefault();
            safeReject(new Error("cancelled"));
            sheet.close();
          };

          const onSubmit = (event) => {
            event.preventDefault();
            const selectedItem = rootEl.querySelector(
              ".student-access-student-item.item-selected",
            );
            const selectedStudent = selectedItem
              ? {
                  id: selectedItem.getAttribute("data-student-id") || "",
                  name: selectedItem.getAttribute("data-student-name") || "",
                  phone: selectedItem.getAttribute("data-student-phone") || "",
                  email: selectedItem.getAttribute("data-student-email") || "",
                  passcode:
                    selectedItem.getAttribute("data-student-passcode") || "",
                }
              : null;

            if (isCredentialsMode) {
              if (!selectedStudent?.id) {
                f7.dialog.alert("Selecteer een student.");
                return;
              }
              if (!normalizePhoneDigits(selectedStudent.phone || "")) {
                f7.dialog.alert("Deze student heeft geen geldig telefoonnummer.");
                return;
              }

              safeResolve({ selectedStudent });
              sheet.close();
              return;
            }

            const phone = phoneInput ? phoneInput.value.trim() : "";
            const activeButton = rootEl.querySelector(
              `#${ids.durationWrap} .button-active`,
            );
            const duration = activeButton
              ? activeButton.getAttribute("data-duration")
              : "7";

            if (!phone) {
              f7.dialog.alert("Selecteer een student of vul een telefoonnummer in.");
              return;
            }

            if (!normalizePhoneDigits(phone)) {
              f7.dialog.alert("Voer een geldig telefoonnummer in.");
              return;
            }

            safeResolve({
              phoneNumber: phone,
              durationDays: duration,
              selectedStudent,
            });
            sheet.close();
          };

          const onSearchInput = () => applySearch();

          studentItems.forEach((item) =>
            item.addEventListener("click", onStudentClick),
          );
          durationButtons.forEach((btn) =>
            btn.addEventListener("click", onDurationClick),
          );
          searchInput?.addEventListener("input", onSearchInput);
          cancelBtn?.addEventListener("click", onCancel);
          submitBtn?.addEventListener("click", onSubmit);

          applySearch();

          // Preselect first visible student with a phone number for faster flow
          const firstSelectable = studentItems.find(
            (item) =>
              item.style.display !== "none" &&
              !item.classList.contains("disabled") &&
              item.getAttribute("data-student-phone"),
          );
          if (firstSelectable) {
            setSelectedStudent(firstSelectable);
          }

          cleanup = () => {
            studentItems.forEach((item) =>
              item.removeEventListener("click", onStudentClick),
            );
            durationButtons.forEach((btn) =>
              btn.removeEventListener("click", onDurationClick),
            );
            searchInput?.removeEventListener("input", onSearchInput);
            cancelBtn?.removeEventListener("click", onCancel);
            submitBtn?.removeEventListener("click", onSubmit);
          };
        },
        closed: () => {
          cleanup();
          sheet.destroy();
          if (!settled) {
            safeReject(new Error("cancelled"));
          }
        },
      },
    });

    sheet.open();
  });
};

const getExistingStudentCredentialsAndAccessLink = async ({
  student,
  schoolId,
} = {}) => {
  if (!student?.id) {
    throw new Error("Selecteer een bestaande student.");
  }
  if (!schoolId) {
    throw new Error("Geen school geselecteerd.");
  }

  const { data: relationship, error: relationshipError } =
    await studentSchoolService.getRelationshipByStudentAndSchool(student.id, schoolId);

  if (relationshipError) {
    throw new Error("Fout bij ophalen van studenttoegang.");
  }

  if (!relationship) {
    throw new Error("Geen bestaand account gevonden voor deze student bij deze rijschool.");
  }

  const now = new Date();

  const passcode = relationship.passcode || student.passcode || generatePasscode();
  let verificationKey = relationship.verification_key || null;
  const existingVerificationKeyExpiry = relationship.verification_key_expires_at
    ? new Date(relationship.verification_key_expires_at)
    : null;
  const isVerificationKeyExpired =
    !existingVerificationKeyExpiry ||
    Number.isNaN(existingVerificationKeyExpiry.getTime()) ||
    now > existingVerificationKeyExpiry;
  const verificationLinkExpiresAt = new Date(now);
  verificationLinkExpiresAt.setDate(verificationLinkExpiresAt.getDate() + 7);

  let needsUpdate =
    !relationship.passcode ||
    !verificationKey ||
    isVerificationKeyExpired ||
    relationship.verification_key_used === true;
  let updates = {
    updated_at: new Date().toISOString(),
  };

  if (!relationship.passcode) {
    updates.passcode = passcode;
  }

  if (!verificationKey) {
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidateKey = generateVerificationKey();
      const candidateUpdates = {
        ...updates,
        verification_key: candidateKey,
        verification_key_used: false,
        verification_key_expires_at: verificationLinkExpiresAt.toISOString(),
      };

      const { data, error } = await studentSchoolService.updateRelationship(
        relationship.id,
        candidateUpdates,
      );
      if (!error) {
        verificationKey = candidateKey;
        updates = candidateUpdates;
        lastError = null;
        needsUpdate = false;
        if (data?.passcode) {
          updates.passcode = data.passcode;
        }
        break;
      }

      lastError = error;
      const errorMessage = error?.message || "";
      const isVerificationKeyConflict =
        errorMessage.includes("409") &&
        /verification_key|duplicate key|unique/i.test(errorMessage);
      if (!isVerificationKeyConflict) {
        throw new Error(error.message || "Fout bij opslaan van verificatielink.");
      }
    }

    if (!verificationKey) {
      throw new Error("Kon geen verificatielink genereren voor deze student.");
    }
  }

  if (needsUpdate) {
    if (!updates.verification_key_expires_at) {
      updates.verification_key_expires_at = verificationLinkExpiresAt.toISOString();
    }
    if (!Object.prototype.hasOwnProperty.call(updates, "verification_key_used")) {
      updates.verification_key_used = false;
    }
    const { error: updateError } = await studentSchoolService.updateRelationship(
      relationship.id,
      updates,
    );
    if (updateError) {
      throw new Error(updateError.message || "Fout bij opslaan van logingegevens.");
    }
  }

  return {
    passcode,
    verifyUrl: buildAbsolutePageUrl("verify-access", { key: verificationKey }),
  };
};

const createAccessTokenLink = async ({
  adminId,
  schoolId,
  durationDays,
  recipientPhone,
}) => {
  if (!schoolId) {
    throw new Error("Geen school geselecteerd voor uitnodiging");
  }

  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays, 10));

  const tokenData = {
    school_id: schoolId,
    admin_id: adminId || null,
    recipient_email: recipientPhone || null,
    token,
    expires_at: expiresAt.toISOString(),
  };

  const { error: tokenError } = await accessTokenService.createToken(tokenData);
  if (tokenError) {
    throw new Error(`Error creating access token: ${tokenError.message}`);
  }

  return `${window.location.origin}/?access_token=${token}`;
};

export const openStudentAccessGrantDialog = async ({
  adminId,
  schoolId,
} = {}) => {
  try {
    const { phoneNumber, durationDays } = await showAccessTokenDialog({
      schoolId,
    });
    f7.preloader.show();
    const accessTokenUrl = await createAccessTokenLink({
      adminId,
      schoolId,
      durationDays,
      recipientPhone: phoneNumber,
    });
    f7.preloader.hide();

    const whatsappUrls = buildWhatsAppUrl({
      phone: phoneNumber,
      message: `Toegang tot rijlesapp: ${accessTokenUrl}`,
    });

    showWhatsAppLaunchDialog({
      title: "WhatsApp klaar",
      description: "Gebruik de knop hieronder om het bericht naar de student te openen.",
      whatsappUrl: isStandalonePwa() ? whatsappUrls.appUrl : whatsappUrls.webUrl,
      whatsappFallbackUrl: whatsappUrls.webUrl,
      buttonText: "Open WhatsApp voor student",
    });
    return accessTokenUrl;
  } catch (error) {
    f7.preloader.hide();
    if (
      error?.message !== "cancelled" &&
      error?.message !== "validation_error"
    ) {
      f7.dialog.alert(error.message || "Fout bij toegang verlenen");
    }
    return null;
  }
};

export const openStudentCredentialsAccessWhatsAppDialog = async ({
  schoolId,
  schoolName,
} = {}) => {
  try {
    const { selectedStudent } = await showAccessTokenDialog({
      schoolId,
      mode: "studentCredentials",
    });

    if (!selectedStudent?.id) {
      f7.dialog.alert(
        "Selecteer een bestaande student om logingegevens te versturen.",
      );
      return null;
    }

    f7.preloader.show();

    const { verifyUrl, passcode } = await getExistingStudentCredentialsAndAccessLink({
      student: selectedStudent,
      schoolId,
    });
    const effectiveSchoolName = schoolName || "je rijschool";
    const effectivePhone = selectedStudent.phone || "";
    const message =
      `Hoi ${selectedStudent.name || ""},\n\n` +
      `Hierbij je logingegevens voor ${effectiveSchoolName}.\n\n` +
      `Telefoonnummer: ${effectivePhone}\n` +
      `Code: ${passcode}\n\n` +
      `Open deze link om je toegang te activeren (ook op een andere browser/telefoon):\n${verifyUrl}\n\n` +
      `Daarna kun je inloggen met je telefoonnummer en code.`;

    const whatsappUrls = buildWhatsAppUrl({
      phone: effectivePhone,
      message,
    });

    f7.preloader.hide();
    showWhatsAppLaunchDialog({
      title: "WhatsApp klaar",
      description: `Gebruik de knop hieronder om de logingegevens voor ${selectedStudent.name || "de student"} te openen.`,
      whatsappUrl: isStandalonePwa() ? whatsappUrls.appUrl : whatsappUrls.webUrl,
      whatsappFallbackUrl: whatsappUrls.webUrl,
      buttonText: "Open WhatsApp met logingegevens",
    });

    return { verifyUrl, passcode, selectedStudent };
  } catch (error) {
    f7.preloader.hide();
    if (
      error?.message !== "cancelled" &&
      error?.message !== "validation_error"
    ) {
      f7.dialog.alert(error.message || "Fout bij versturen van logingegevens");
    }
    return null;
  }
};
