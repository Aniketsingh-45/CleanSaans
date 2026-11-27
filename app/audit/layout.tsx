import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Household Air Pollution Audit",
  description:
    "Audit your home, room, or kitchen for air pollution leaks and open burning with AI vision analysis.",
  openGraph: {
    title: "Household Air Pollution Audit | CleanSaans",
    description:
      "Audit your home, room, or kitchen for air pollution leaks and open burning with AI vision analysis.",
  },
};

export default function AuditLayout({ children }: { children: ReactNode }) {
  return children;
}
