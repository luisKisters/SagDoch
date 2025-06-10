import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const APP_NAME = "Wahrheit oder Pflicht";
const APP_DEFAULT_TITLE = "Wahrheit oder Pflicht Spiel";
const APP_TITLE_TEMPLATE = "%s - W/P App";
const APP_DESCRIPTION = "Spiele Wahrheit oder Pflicht mit deinen Freunden!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0F1B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" dir="ltr" suppressHydrationWarning={true}>
      <head>
        <meta
          name="google-site-verification"
          content="pwT4xGmw1yQ0vLmlGRXKJVgSY8YKM3zfdN1sSofkZ8g"
        />
      </head>
      <body className={`${orbitron.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
