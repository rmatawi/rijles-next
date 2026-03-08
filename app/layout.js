import "./globals.css";

export const metadata = {
  title: "Rijles",
  description: "Rijles app migration to Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
