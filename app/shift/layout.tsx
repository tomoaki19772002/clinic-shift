import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "川越あさひ眼科　シフト表",
  description: "川越あさひ眼科スタッフシフト管理",
};

export default function ShiftLayout({ children }: { children: React.ReactNode }) {
  return children;
}
