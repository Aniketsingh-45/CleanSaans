import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("Web App Manifest", () => {
  it("generates correct PWA manifest metadata", () => {
    const config = manifest();

    expect(config.name).toBe("CleanSaans");
    expect(config.short_name).toBe("CleanSaans");
    expect(config.theme_color).toBe("#0f766e");
    expect(config.display).toBe("standalone");
    expect(config.start_url).toBe("/");

    // Icons: must have 192, 512, and SVG
    expect(config.icons).toBeDefined();
    const icons = config.icons!;
    expect(icons.length).toBeGreaterThanOrEqual(3);

    const icon192 = icons.find((i) => i.sizes === "192x192");
    expect(icon192).toBeDefined();
    expect(icon192?.src).toBe("/icons/icon-192.png");
    expect(icon192?.type).toBe("image/png");

    const icon512 = icons.find((i) => i.sizes === "512x512");
    expect(icon512).toBeDefined();
    expect(icon512?.src).toBe("/icons/icon-512.png");
    expect(icon512?.type).toBe("image/png");

    const iconSvg = icons.find((i) => i.type === "image/svg+xml");
    expect(iconSvg).toBeDefined();
    expect(iconSvg?.src).toBe("/icons/icon.svg");
  });
});
