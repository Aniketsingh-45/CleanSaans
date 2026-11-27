import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlanAction } from "@/lib/data/plan";
import { LanguageProvider } from "@/lib/i18n";
import { DailyPlan } from "./DailyPlan";

const mockActions: PlanAction[] = [
  {
    id: "action-routine-1",
    time: "12:00 - 15:00",
    category: "routine",
    title: "Dupahar ke saaf samay khidkiyan kholein",
    why: "Is samay PM2.5 sabse kam hota hai jisse taazi hawa aati hai.",
    impact: {
      cigsSavedLow: 0.8,
      cigsSavedHigh: 1.2,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  },
  {
    id: "action-routine-2",
    time: "07:00 - 10:00",
    category: "routine",
    title: "Subah ke pradushit samay N95 mask pehnein",
    why: "Subah PM2.5 charam par hota hai, mask lagbhag 95% particulate rokta hai.",
    impact: {
      cigsSavedLow: 1.5,
      cigsSavedHigh: 2.0,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 30,
    },
  },
  {
    id: "action-indoor-1",
    time: "Khana banate waqt",
    category: "indoor",
    title: "Kitchen exhaust fan chalu rakhein",
    why: "Exhaust fan se rasoi ka dhuan aur gas seedhe bahar nikal jaati hai.",
    impact: {
      cigsSavedLow: 0.5,
      cigsSavedHigh: 0.7,
      inrSaved: 0,
      co2KgSaved: 0,
      costInr: 0,
    },
  },
  {
    id: "action-indoor-2",
    time: "Shaam ko",
    category: "indoor",
    title: "Dhoop agarbatti na jalayein",
    why: "Agarbatti se kamre ke andar 200+ ug/m3 barabar dhuan badh jaata hai.",
    impact: {
      cigsSavedLow: 0.4,
      cigsSavedHigh: 0.6,
      inrSaved: 10,
      co2KgSaved: 0,
      costInr: 0,
    },
  },
  {
    id: "action-sustainable-1",
    time: "Commute ke waqt",
    category: "sustainable",
    title: "Car ki jagah Metro ya Bus lein",
    why: "Metro se aap sadak ke seedhe exhaust dhuan se bachte hain aur paise bachte hain.",
    impact: {
      cigsSavedLow: 1.0,
      cigsSavedHigh: 1.4,
      inrSaved: 80,
      co2KgSaved: 2.5,
      costInr: 0,
    },
  },
];

describe("DailyPlan Component", () => {
  it("renders the three distinct categorized sections: routine, indoor, and sustainable", () => {
    render(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="ai" />
      </LanguageProvider>
    );

    expect(screen.getByRole("heading", { level: 2, name: /aaj ka.*plan/i })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 3, name: /low-emission daily routines/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /indoor air quality hacks/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /sustainable alternatives/i })
    ).toBeInTheDocument();
  });

  it("sorts free actions (costInr === 0) before paid actions within a section", () => {
    render(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="ai" />
      </LanguageProvider>
    );

    const routineSection = screen
      .getByRole("heading", { level: 3, name: /low-emission daily routines/i })
      .closest("div");

    expect(routineSection).not.toBeNull();
    const articles = routineSection!.querySelectorAll("article");
    expect(articles).toHaveLength(2);

    // Free action first
    expect(articles[0]).toHaveTextContent(/dupahar ke saaf samay khidkiyan kholein/i);
    expect(articles[0]).toHaveTextContent(/muft/i);

    // Paid action second
    expect(articles[1]).toHaveTextContent(/subah ke pradushit samay n95 mask pehnein/i);
    expect(articles[1]).toHaveTextContent(/₹30/i);
  });

  it("renders impact chips accurately (cigs saved, inr saved, co2 saved)", () => {
    render(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="ai" />
      </LanguageProvider>
    );

    expect(screen.getByText(/~0\.8-1\.2 cigs kam/i)).toBeInTheDocument();
    expect(screen.getByText(/₹80 bachega/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.5 kg co₂ kam/i)).toBeInTheDocument();
  });

  it("renders AI polish badge when source is 'ai' and rules badge when source is 'rules'", () => {
    const { rerender } = render(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="ai" />
      </LanguageProvider>
    );
    expect(screen.getByText(/ai polish/i)).toBeInTheDocument();

    rerender(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="rules" />
      </LanguageProvider>
    );
    expect(screen.getByText(/rules-based/i)).toBeInTheDocument();
  });

  it("expands and collapses the 'Kyun?' explanation panel with aria-expanded", () => {
    render(
      <LanguageProvider>
        <DailyPlan actions={mockActions} source="ai" />
      </LanguageProvider>
    );

    const kyunButtons = screen.getAllByRole("button", { name: /kyun\?/i });
    const firstKyun = kyunButtons[0]!;

    expect(firstKyun).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/is samay pm2\.5 sabse kam hota hai jisse taazi hawa aati hai\./i)
    ).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(firstKyun);
    expect(firstKyun).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/is samay pm2\.5 sabse kam hota hai jisse taazi hawa aati hai\./i)
    ).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(firstKyun);
    expect(firstKyun).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(/is samay pm2\.5 sabse kam hota hai jisse taazi hawa aati hai\./i)
    ).not.toBeInTheDocument();
  });
});
