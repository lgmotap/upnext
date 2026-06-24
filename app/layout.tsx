import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/config";
import { JsonLd } from "@/components/seo/JsonLd";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default:
      "Booking Software for Cleaning, Lawn Care, Handyman & Home Service Businesses | UpNext",
    template: "%s | UpNext",
  },
  description:
    "UpNext is online booking and business software for home-service providers — solo or team. Get booked online and manage jobs, customers, your team, and payments in one place. Join the early-access waitlist.",
  keywords: [
    "online booking software",
    "service business software",
    "cleaning business software",
    "lawn care software",
    "handyman software",
    "booking software for home services",
    "scheduling software for service businesses",
  ],
  openGraph: {
    title: site.tagline,
    description: site.description,
    siteName: site.name,
    type: "website",
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: site.tagline,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
