import { normalizePhoneForWhatsApp } from "../services/adminContactService";

const DEFAULT_ADMIN_ACCESS_WHATSAPP = "8754335";

export const getAdminAccessWhatsAppNumber = () => {
  const configured = process.env.VITE_REACT_APP_ADMIN_ACCESS_WHATSAPP;
  const raw = configured || DEFAULT_ADMIN_ACCESS_WHATSAPP;
  return normalizePhoneForWhatsApp(raw);
};

