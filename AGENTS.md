# CleanSaans rules
- Stack: Next.js App Router, TypeScript (strict), Tailwind. No separate backend.
- ALL numbers (cigarette equivalent, INR, CO2, % saved) come ONLY from /lib/engine. The LLM never calculates or changes numbers.
- Show ranges (low-high), label "approx". Never fake precision.
- UI: simple Hinglish by default, Hindi/English toggle.
- API keys only in server code. Never in client code or git.
- Validate every API input and every LLM output with zod.
- Accessibility: semantic HTML, labels, keyboard support, contrast, aria-live, reduced motion, min 44px touch targets.
- Small changes only. After each feature run lint, tests, build and summarise changes.
- Free/low-cost actions before paid items.
- Write clean, commented, typed code. No `any`, no dead code.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
