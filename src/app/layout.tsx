/** @format */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";

import { TanstackProvider } from "@/lib/tanstack";
import { Middleware } from "@/lib/middleware";
import { Toaster } from "react-hot-toast";

import LoadingPage from "@/components/LoadingPage";

import "@/styles/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Supply Dashboard",
  description: "Supply Chain Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={montserrat.variable}>
        <Suspense fallback={<LoadingPage />}>
          <Middleware>
            <TanstackProvider>
              <Toaster />
              {children}
            </TanstackProvider>
          </Middleware>
        </Suspense>
      </body>
    </html>
  );
}
