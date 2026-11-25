import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the CleanSaans heading, tagline, accessible landmarks, and footer disclaimer", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: /cleansaans/i })).toBeInTheDocument();
    expect(screen.getByText(/saaf saans, sabke saath\./i)).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/setup taiyaar/i)).toBeInTheDocument();
    expect(screen.getByText(/saans lene mein dikkat/i)).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /CleanSaans: sirf jaankari ke liye, doctor ki salah nahi\. Sabhi numbers approximate hain\./i
    );
  });
});
