import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import DisclaimerGate from "@/components/DisclaimerGate";
import PresenceBeacon from "@/components/PresenceBeacon";
import SiteFooter from "@/components/SiteFooter";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FermasHub",
  description: "Rede privada da Associacao do Colegio Fermas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider />
          <DisclaimerGate />
          <PresenceBeacon />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
