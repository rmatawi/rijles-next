"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

const normalizeTarget = (target) => {
  if (!target) return "/";
  if (typeof target === "string") return target;
  if (typeof target?.url === "string") return target.url;
  return "/";
};

export default function useAppNavigation() {
  const router = useRouter();

  const navigate = useCallback(
    (target, options = {}) => {
      const url = normalizeTarget(target);
      const shouldReload = options?.reloadAll || options?.reloadCurrent;

      if (shouldReload && typeof window !== "undefined") {
        window.location.assign(url);
        return;
      }

      if (options?.replaceState || options?.replace) {
        router.replace(url);
        return;
      }

      router.push(url);
    },
    [router],
  );

  const back = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length <= 1) {
      router.replace("/");
      return;
    }

    router.back();
  }, [router]);

  return { navigate, back };
}
