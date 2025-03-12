import type { Metadata } from "next";
import AdminLayoutClient from "@/components/layout/AdminLayoutClient";

export const metadata: Metadata = {
  title: "管理画面 - JCF Ticket",
  description: "Japan Coffee Festival チケット管理システム",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
