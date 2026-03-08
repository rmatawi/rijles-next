import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import { getSeoConfig, resolveSiteUrl } from "./_lib/seoConfig";
import ServiceWorkerRegistration from "./_components/ServiceWorkerRegistration";

export async function generateMetadata() {
  const headersList = await headers();
  const siteUrl = resolveSiteUrl(headersList);
  const seoConfig = getSeoConfig(siteUrl);

  return {
    metadataBase: new URL(siteUrl),
    title: seoConfig.baseTitle,
    description: seoConfig.description,
    keywords: seoConfig.keywords || undefined,
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: seoConfig.ogTitle,
      description: seoConfig.description,
      url: siteUrl,
      type: "website",
      images: [seoConfig.ogImage],
      siteName: seoConfig.baseTitle,
      locale: "nl_SR",
    },
    twitter: {
      card: "summary_large_image",
      title: seoConfig.ogTitle,
      description: seoConfig.description,
      images: [seoConfig.ogImage],
    },
    verification: {
      google: seoConfig.googleVerification || undefined,
    },
    authors: seoConfig.businessName ? [{ name: seoConfig.businessName }] : undefined,
    other: {
      "google-adsense-account": "ca-pub-2987900572749814",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#212121",
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const siteUrl = resolveSiteUrl(headersList);
  const seoConfig = getSeoConfig(siteUrl);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AutoSchool",
    name: seoConfig.businessName,
    description: seoConfig.description,
    url: seoConfig.siteUrl,
    logo: seoConfig.logoUrl || undefined,
    image: seoConfig.ogImage,
    telephone: seoConfig.phone || undefined,
    email: seoConfig.email || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: seoConfig.addressLocality || undefined,
      addressCountry: seoConfig.addressCountry || undefined,
    },
    areaServed: {
      "@type": "City",
      name: seoConfig.addressLocality || undefined,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: seoConfig.ratingValue || undefined,
      reviewCount: seoConfig.reviewCount || undefined,
    },
  };
  const shouldLoadAdsense = process.env.NODE_ENV === "production";

  return (
    <html lang="nl">
      <body>
        <ServiceWorkerRegistration />
        {shouldLoadAdsense ? (
          <Script
            async
            crossOrigin="anonymous"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2987900572749814"
            strategy="afterInteractive"
          />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
