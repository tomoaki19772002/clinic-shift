import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "川越あさひ眼科　問診票",
  description: "川越あさひ眼科の問診票です。",
};

export default function MonsinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
