/** @format */

"use client";

import {
  QueryClientProvider,
  DehydratedState,
  HydrationBoundary,
} from "@tanstack/react-query";

import { ReactNode, useState } from "react";

import { QueryClient } from "@tanstack/react-query";

export const getQueryClient = () => new QueryClient();

export function TanstackProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  const emptyState: DehydratedState = { mutations: [], queries: [] };

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={emptyState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
