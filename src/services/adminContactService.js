import { adminService } from "./adminService";
import { schoolService } from "./schoolService";
import { openExternalUrl } from "../utils/externalLinks";

const logInstructorTrace = () => {};
const maskPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
};

const isEmail = (value) => String(value || "").includes("@");
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

export const normalizePhoneForWhatsApp = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("597")) return digits;
  if (digits.startsWith("0")) return `597${digits.slice(1)}`;
  return `597${digits}`;
};

const buildWhatsAppUrls = ({ normalizedPhone, message = "" } = {}) => {
  const encodedMessage = encodeURIComponent(message || "");
  return {
    appUrl: `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`,
    webUrl: `https://wa.me/${normalizedPhone}?text=${encodedMessage}`,
  };
};

export const resolveAdminByReference = async (adminRef) => {
  if (!adminRef) return { data: null, error: null };

  const ref = String(adminRef).trim();
  if (!ref) return { data: null, error: null };

  const result = isEmail(ref)
    ? await adminService.getAdminByEmail(ref)
    : await adminService.getAdminById(ref);

  return result;
};

export const resolveRelatedAdminPhone = async ({
  schoolId,
  studentId = null,
  preferredAdminRef = null,
}) => {
  if (!schoolId) {
    return { phone: null, admin: null, school: null, error: new Error("Missing schoolId") };
  }

  const { data: school, error: schoolError } = await schoolService.getSchoolById(schoolId);
  if (schoolError || !school) {
    return {
      phone: null,
      admin: null,
      school: null,
      error: schoolError || new Error("School not found"),
    };
  }

  let effectiveAdminRef = preferredAdminRef;
  if (!effectiveAdminRef) {
    const { instructorService } = await import("./instructorService");
    const resolved = await instructorService.resolveAdminIdForFlow({
      schoolId,
      prioritizeCurrentAdmin: false,
      includeExplicitInstructor: true,
      includeEnvFallback: true,
    });
    effectiveAdminRef = resolved.adminId || null;
  }

  const adminRefs = effectiveAdminRef ? [effectiveAdminRef] : [];
  logInstructorTrace("resolveRelatedAdminPhone:candidates", {
    schoolId,
    studentId,
    preferredAdminRef,
    effectiveAdminRef,
    adminRefs,
  });

  for (const adminRef of adminRefs) {
    const { data: adminData } = await resolveAdminByReference(adminRef);
    logInstructorTrace("resolveRelatedAdminPhone:candidateResult", {
      adminRef,
      resolvedAdminId: adminData?.id || null,
      hasPhone: !!adminData?.phone,
      phoneMasked: maskPhone(adminData?.phone),
    });
    logInstructorTrace("resolveRelatedAdminPhone:resolved", {
      sourceAdminRef: adminRef,
      resolvedAdminId: adminData?.id || null,
      hasPhone: !!adminData?.phone,
      phoneMasked: maskPhone(adminData?.phone),
    });
    return {
      phone: adminData?.phone || null,
      admin: adminData || null,
      school,
      sourceAdminRef: adminRef,
      error: adminData ? null : new Error("Geen beheerder gevonden voor de ingestelde instructeur"),
    };
  }
  logInstructorTrace("resolveRelatedAdminPhone:resolved", {
    sourceAdminRef: null,
    resolvedAdminId: null,
    hasPhone: false,
  });

  return {
    phone: null,
    admin: null,
    school,
    sourceAdminRef: null,
    error: new Error("Geen telefoonnummer gevonden voor de beheerder"),
  };
};

export const resolveActiveAdminContact = async ({
  schoolId,
  studentId = null,
  authUser = null,
  canManageCurrentSchool = false,
} = {}) => {
  if (!schoolId) {
    return {
      phone: null,
      normalizedPhone: "",
      admin: null,
      source: "missing-school",
      error: new Error("Missing schoolId"),
    };
  }

  const { instructorService } = await import("./instructorService");
  const preferred = await instructorService.resolveAdminIdForFlow({
    schoolId,
    authUser,
    prioritizeCurrentAdmin: false,
    includeExplicitInstructor: true,
    includeEnvFallback: true,
  });

  const { phone, admin, sourceAdminRef, error } = await resolveRelatedAdminPhone({
    schoolId,
    studentId,
    preferredAdminRef: preferred.adminId,
  });

  let activeAdmin = admin || null;
  let source = sourceAdminRef || preferred.source || "unresolved";

  const finalPhone = activeAdmin?.phone || phone || "";
  const normalizedPhone = normalizePhoneForWhatsApp(finalPhone);
  logInstructorTrace("resolveActiveAdminContact:resolved", {
    schoolId,
    authUserEmail: authUser?.email || null,
    canManageCurrentSchool: !!canManageCurrentSchool,
    preferredAdminId: preferred.adminId || null,
    preferredSource: preferred.source || null,
    source,
    activeAdminId: activeAdmin?.id || null,
    activeAdminEmail: activeAdmin?.email || null,
    hasPhone: !!normalizedPhone,
    phoneMasked: maskPhone(finalPhone),
  });

  return {
    phone: finalPhone || null,
    normalizedPhone,
    admin: activeAdmin,
    schoolId,
    source,
    error: error || null,
  };
};

export const openAdminWhatsAppContact = async ({
  schoolId,
  studentId = null,
  authUser = null,
  canManageCurrentSchool = false,
  message = "",
  target = "_blank",
} = {}) => {
  const resolved = await resolveActiveAdminContact({
    schoolId,
    studentId,
    authUser,
    canManageCurrentSchool,
  });

  if (!resolved.normalizedPhone) {
    return {
      ...resolved,
      opened: false,
      whatsappUrl: null,
      error: resolved.error || new Error("Geen telefoonnummer gevonden voor de beheerder"),
    };
  }

  const { appUrl, webUrl } = buildWhatsAppUrls({
    normalizedPhone: resolved.normalizedPhone,
    message,
  });
  const whatsappUrl = isStandalonePwa() ? appUrl : webUrl;
  openExternalUrl(whatsappUrl, { target: isStandalonePwa() ? "_self" : target });

  return {
    ...resolved,
    opened: true,
    whatsappUrl,
    whatsappFallbackUrl: webUrl,
  };
};

export const openWhatsAppWithPhone = ({
  phone,
  message = "",
  target = "_blank",
} = {}) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone || "");
  if (!normalizedPhone) {
    return {
      opened: false,
      whatsappUrl: null,
      normalizedPhone,
      error: new Error("Geen geldig telefoonnummer"),
    };
  }

  const { appUrl, webUrl } = buildWhatsAppUrls({
    normalizedPhone,
    message,
  });
  const whatsappUrl = isStandalonePwa() ? appUrl : webUrl;
  openExternalUrl(whatsappUrl, { target: isStandalonePwa() ? "_self" : target });

  return {
    opened: true,
    whatsappUrl,
    whatsappFallbackUrl: webUrl,
    normalizedPhone,
    error: null,
  };
};
