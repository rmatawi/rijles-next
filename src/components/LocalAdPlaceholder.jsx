import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  useStore,
} from "framework7-react";
import { adsService } from "../services/adsService";
import { isAdminUser, isSuperAdmin } from "../js/utils";
import { openExternalUrl } from "../utils/externalLinks";

const QUICK_ONE_LINERS_NL = [
  "Adverteer waar toekomstige bestuurders elke dag leren.",
  "Van theorie naar sleutel: bereik kopers voordat ze kopen.",
  "De enige mobiele rijtheorie-app in Suriname, met dagelijks bereik.",
];

const ADVERTISER_VARIANTS = [
  {
    type: "Autodealer",
    headline: "Meer showroombezoekers via onze rijtheorie-app",
    description:
      "Bereik toekomstige bestuurders precies in de fase waarin zij hun eerste of volgende auto overwegen.",
    chips: ["Intentie om te kopen", "Lokaal bereik", "WhatsApp leads"],
    cta: "Bekijk dealerpakketten",
  },
  {
    type: "Verzekering",
    headline: "Zichtbaar bij nieuwe bestuurders die dekking zoeken",
    description:
      "Positioneer uw verzekering voor het moment van aankoop, met herhaalde exposure in een relevante leeromgeving.",
    chips: ["Nieuwe bestuurders", "Hoge relevantie", "Meetbare CTR"],
    cta: "Bekijk verzekeringspakketten",
  },
  {
    type: "Garage",
    headline: "Word de vaste servicepartner voor nieuwe automobilisten",
    description:
      "Promoot onderhoud, banden en checks bij een doelgroep die actief op weg is naar zelfstandig rijden.",
    chips: ["Onderhoud & banden", "Regionale zichtbaarheid", "Terugkerende users"],
    cta: "Bekijk servicepakketten",
  },
];

const LocalAdPlaceholder = ({
  adSlot = "general",
  slot,
  headline,
  description,
  ctaLabel,
  style = {},
}) => {
  const authUser = useStore("authUser");
  const resolvedSlot = adSlot || slot || "general";
  const [activeAd, setActiveAd] = useState(null);
  const trackedImpressionsRef = useRef(new Set());
  const shouldHideForAdmin = isAdminUser(authUser) && !isSuperAdmin(authUser?.email);

  const randomOneLiner = useMemo(() => {
    const idx = Math.floor(Math.random() * QUICK_ONE_LINERS_NL.length);
    return QUICK_ONE_LINERS_NL[idx];
  }, []);

  const randomVariant = useMemo(() => {
    const idx = Math.floor(Math.random() * ADVERTISER_VARIANTS.length);
    return ADVERTISER_VARIANTS[idx];
  }, []);

  const finalHeadline = headline || randomVariant.headline;
  const finalDescription = description || randomVariant.description;
  const finalCtaLabel = ctaLabel || randomVariant.cta;

  const highlights = useMemo(() => randomVariant.chips.slice(0, 2), [randomVariant]);

  useEffect(() => {
    if (shouldHideForAdmin) return;
    let mounted = true;

    const loadAd = async () => {
      const { data } = await adsService.getRandomActiveAdBySlot(resolvedSlot);
      if (!mounted) return;
      setActiveAd(data || null);
    };

    loadAd();

    return () => {
      mounted = false;
    };
  }, [resolvedSlot, shouldHideForAdmin]);

  useEffect(() => {
    if (shouldHideForAdmin) return;
    if (!activeAd?.id) return;
    if (trackedImpressionsRef.current.has(activeAd.id)) return;
    trackedImpressionsRef.current.add(activeAd.id);

    adsService.recordAdEvent({
      adId: activeAd.id,
      eventType: "impression",
      slot: resolvedSlot,
      targetUrl: activeAd.target_url || null,
    });
  }, [activeAd, resolvedSlot, shouldHideForAdmin]);

  if (shouldHideForAdmin) {
    return null;
  }

  if (activeAd) {
    const adTitle = activeAd.title || finalHeadline;
    const adBody = activeAd.body || finalDescription;
    const adCta = activeAd.cta_label || "Bekijk aanbod";
    const targetUrl = activeAd.target_url || "/adverteren";

    return (
      <Card
        outline
        style={{
          margin: "16px",
          border: "1px solid #e8e8e8",
          background: "#ffffff",
          ...style,
        }}
      >
        <CardHeader style={{ fontWeight: 700, color: "#444" }}>
          Gesponsord {activeAd.sponsor_name ? `- ${activeAd.sponsor_name}` : ""}
        </CardHeader>
        <CardContent>
          {activeAd.image_url && (
            <div style={{ marginBottom: "10px" }}>
              <img
                src={activeAd.image_url}
                alt={adTitle}
                style={{
                  width: "100%",
                  maxHeight: "180px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
            </div>
          )}
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
            {adTitle}
          </div>
          <div style={{ marginBottom: "8px", lineHeight: 1.45 }}>{adBody}</div>
          <div style={{ fontSize: "11px", opacity: 0.75 }}>
            advertentiepositie: <strong>{resolvedSlot}</strong>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            fill
            color="red"
            onClick={() => {
              adsService.recordAdEvent({
                adId: activeAd.id,
                eventType: "click",
                slot: resolvedSlot,
                targetUrl,
              });
              if (typeof window !== "undefined") {
                openExternalUrl(targetUrl);
              }
            }}
          >
            {adCta}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      outline
      style={{
        margin: "16px",
        border: "2px solid #ff3b30",
        background: "linear-gradient(160deg, #fff8e1 0%, #ffe7c2 100%)",
        ...style,
      }}
    >
      <CardHeader style={{ fontWeight: 700, color: "#b00020" }}>
        Voor adverteerders - {randomVariant.type}
      </CardHeader>
      <CardContent>
        <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
          {finalHeadline}
        </div>
        <div
          style={{
            marginBottom: "8px",
            fontWeight: 600,
            color: "#7a0014",
            lineHeight: 1.4,
          }}
        >
          {randomOneLiner}
        </div>
        <div style={{ marginBottom: "10px", lineHeight: 1.45 }}>{finalDescription}</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
          {highlights.map((item) => (
            <span
              key={item}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#7a0014",
                border: "1px solid #ffb3a8",
                borderRadius: "999px",
                padding: "4px 8px",
                background: "#fff4f1",
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ fontSize: "11px", opacity: 0.75 }}>
          advertentiepositie: <strong>{resolvedSlot}</strong>
        </div>
      </CardContent>
      <CardFooter>
        <Button fill color="red" href="/adverteren">
          {finalCtaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocalAdPlaceholder;
