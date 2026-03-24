/** @format */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useGlobalState } from "@/lib/middleware";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { state } = useGlobalState();

  useEffect(() => {
    if (!state.isLoading && !state.hasLogin) {
      router.replace("/login");
    }
  }, [state.isLoading, state.hasLogin, router]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!state.hasLogin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 grow min-w-0">
        <div className="p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
