const EXTERNAL_LINK_ACTIVATOR_ID = "external-link-activator";

const ensureExternalLinkActivator = () => {
  if (typeof document === "undefined") {
    return null;
  }

  let linkEl = document.getElementById(EXTERNAL_LINK_ACTIVATOR_ID);
  if (linkEl instanceof HTMLAnchorElement) {
    return linkEl;
  }

  linkEl = document.createElement("a");
  linkEl.id = EXTERNAL_LINK_ACTIVATOR_ID;
  linkEl.className = "external";
  linkEl.setAttribute("external", "");
  linkEl.setAttribute("aria-hidden", "true");
  linkEl.tabIndex = -1;
  linkEl.textContent = "Open external link";
  linkEl.style.position = "fixed";
  linkEl.style.left = "-9999px";
  linkEl.style.top = "0";
  linkEl.style.width = "1px";
  linkEl.style.height = "1px";
  linkEl.style.opacity = "0";
  linkEl.style.pointerEvents = "none";

  document.body.appendChild(linkEl);
  return linkEl;
};

const fallbackOpenExternalUrl = (url, target) => {
  if (!url || typeof window === "undefined") {
    return false;
  }

  if (target === "_self") {
    window.location.assign(url);
    return true;
  }

  const openedWindow = window.open(url, target || "_blank", "noopener,noreferrer");
  return openedWindow !== null;
};

export const openExternalUrl = (url, { target = "_blank", rel = "noopener noreferrer" } = {}) => {
  if (!url || typeof document === "undefined") {
    return false;
  }

  const linkEl = ensureExternalLinkActivator();
  if (!linkEl) {
    return fallbackOpenExternalUrl(url, target);
  }

  linkEl.href = url;
  linkEl.target = target;
  if (rel) {
    linkEl.rel = rel;
  } else {
    linkEl.removeAttribute("rel");
  }

  try {
    linkEl.click();
    return true;
  } catch (error) {
    return fallbackOpenExternalUrl(url, target);
  }
};
