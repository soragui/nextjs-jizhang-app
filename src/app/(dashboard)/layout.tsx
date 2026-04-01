"use client";

import { SidebarNavigation } from "@/components/sidebar-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarNavigation>{children}</SidebarNavigation>;
}
