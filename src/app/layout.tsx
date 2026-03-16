import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deep Field — Hwang Jin Young",
  description: "A digital archive of work by Hwang Jin Young.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ROM Variable — Google Fonts / CDN attempt.
            Falls back gracefully to system fonts if unavailable. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* "ROM Variable" is not on Google Fonts, so we load the closest match
            and use a @font-face override below; update the URL with a real CDN
            path if you have the actual ROM Variable files. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
