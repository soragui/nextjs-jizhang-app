"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { ReactNode } from "react";

interface ErrorBoundaryLayoutProps {
  children: ReactNode;
}

/**
 * Reusable layout component that wraps children in an ErrorBoundary.
 * Use in route segment layouts to catch errors in that route tree.
 *
 * @example
 * // src/app/transactions/layout.tsx
 * export default function Layout({ children }: { children: ReactNode }) {
 *   return <ErrorBoundaryLayout>{children}</ErrorBoundaryLayout>;
 * }
 */
export function ErrorBoundaryLayout({ children }: ErrorBoundaryLayoutProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
