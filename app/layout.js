import "./globals.css";
import Script from "next/script";

const canonicalUrl =
  process.env.VITE_SEO_CANONICAL_URL || "http://localhost:4000";
const businessName = process.env.VITE_SEO_BUSINESS_NAME || "Rijles";
const description =
  process.env.VITE_SEO_DESCRIPTION || "Rijles app migration to Next.js";
const ogImage = process.env.VITE_SEO_OG_IMAGE || "/icons/apple-touch-icon.png";
const seoTitle = process.env.VITE_SEO_TITLE || "Rijles";
const ogTitle = process.env.VITE_SEO_OG_TITLE || seoTitle;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "AutoSchool",
  name: businessName,
  description,
  url: canonicalUrl,
  logo: process.env.VITE_SEO_LOGO_URL || undefined,
  image: ogImage,
  telephone: process.env.VITE_SEO_PHONE || undefined,
  email: process.env.VITE_SEO_EMAIL || undefined,
  address: {
    "@type": "PostalAddress",
    addressLocality: process.env.VITE_SEO_ADDRESS_LOCALITY || undefined,
    addressCountry: process.env.VITE_SEO_ADDRESS_COUNTRY || undefined,
  },
  areaServed: {
    "@type": "City",
    name: process.env.VITE_SEO_ADDRESS_LOCALITY || undefined,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: process.env.VITE_SEO_RATING_VALUE || undefined,
    reviewCount: process.env.VITE_SEO_REVIEW_COUNT || undefined,
  },
};

export const metadata = {
  metadataBase: new URL(canonicalUrl),
  title: seoTitle,
  description,
  keywords: process.env.VITE_SEO_KEYWORDS || undefined,
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: ogTitle,
    description,
    url: canonicalUrl,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description,
    images: [ogImage],
  },
  verification: {
    google: process.env.VITE_GOOGLE_SITE_VERIFICATION || undefined,
  },
  authors: process.env.VITE_SEO_BUSINESS_NAME
    ? [{ name: process.env.VITE_SEO_BUSINESS_NAME }]
    : undefined,
  other: {
    "google-adsense-account": "ca-pub-2987900572749814",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#212121",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <Script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2987900572749814"
          strategy="afterInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
