import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Family Profile Setup",
  description:
    "Set up your family profile, commute habits, and indoor air environment for personalized pollution protection.",
  openGraph: {
    title: "Family Profile Setup | CleanSaans",
    description:
      "Set up your family profile, commute habits, and indoor air environment for personalized pollution protection.",
  },
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
