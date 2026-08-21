/**
 * The disclosure timeline (docs/storyboard.md §7).
 *
 * A sticky section whose scroll scrubs the rail sideways. Each milestone card
 * carries the date, what happened, and the status of all three attacks at that
 * moment — so the reader watches three red markers turn green at the dates they
 * actually turned green, rather than reading a claim that they did.
 *
 * This is the strongest credibility asset on the page: "we reported it and the
 * system changed" is the part a sceptical reader is checking for. It gets the
 * room, and it gets the honest footnote about what we were never told.
 */

import StickyScene from "./StickyScene.tsx";
import { clamp01 } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEDGER_TOKENS } from "./ledger-motion.ts";
import { DISCLOSURE_NOTE, MILESTONES } from "../data/disclosure.ts";
import { ATTACKS } from "../data/attacks.ts";

function StatusRow({
  status,
}: {
  status: (typeof MILESTONES)[number]["status"];
}) {
  return (
    <div className="mt-4 flex gap-4 border-t border-border pt-3">
      {ATTACKS.map((attack) => {
        const fixed = status[attack.id] === "fixed";
        return (
          <span key={attack.id} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: fixed
                  ? LEDGER_TOKENS.credit
                  : LEDGER_TOKENS.debit,
              }}
            />
            <span className="font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
              {attack.tag}
            </span>
            <span
              className="font-(family-name:--font-mono) text-xs"
              style={{
                color: fixed ? LEDGER_TOKENS.credit : LEDGER_TOKENS.debit,
              }}
            >
              {fixed ? "fixed" : "viable"}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function DisclosureTimeline() {
  const count = MILESTONES.length;

  return (
    <StickyScene
      steps={count}
      label="Disclosure timeline, from the April 2025 reports to the last attack being resolved in January 2026"
    >
      {(position: ScenePosition, isStatic: boolean) => {
        if (isStatic) {
          return (
            <div className="mx-auto w-full max-w-2xl px-6">
              <ol className="space-y-6">
                {MILESTONES.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border bg-card p-5"
                  >
                    <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--ach-provisional)] uppercase">
                      {m.label}
                    </span>
                    <h3 className="mt-2 font-(family-name:--font-display) text-base font-semibold text-foreground">
                      {m.headline}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {m.detail}
                    </p>
                    <StatusRow status={m.status} />
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm text-[var(--text-muted)]">
                {DISCLOSURE_NOTE}
              </p>
            </div>
          );
        }

        // Scrub the rail sideways: the active card sits centred, the rest slide
        // past it. Translation only — the cards are laid out once and moved.
        //
        // The shift has to be in absolute units, not percentages: a percentage
        // in `translateX` resolves against the *flex row's* width (five cards,
        // 160rem), not the viewport, which put the active card wherever it
        // happened to land.
        const offset = position.index + position.local;

        return (
          <div className="w-full overflow-hidden">
            {/* the rail */}
            <div className="relative mx-auto mb-8 h-px w-full max-w-4xl bg-border">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${clamp01(offset / (count - 1)) * 100}%`,
                  background: LEDGER_TOKENS.accent,
                }}
              />
            </div>

            <div
              className="flex"
              style={{
                // CARD is 32rem wide; centre the active one under the viewport.
                transform: `translateX(calc(50vw - 16rem - ${offset} * 32rem))`,
                transition: "transform 120ms linear",
              }}
            >
              {MILESTONES.map((m, i) => (
                <div
                  key={m.id}
                  className="w-[32rem] shrink-0 px-4"
                  style={{
                    opacity: i === position.index ? 1 : 0.32,
                    transition: "opacity 200ms ease-out",
                  }}
                >
                  <div className="rounded-lg border border-border bg-card p-6">
                    <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--ach-provisional)] uppercase">
                      {m.label}
                    </span>
                    <h3 className="mt-2 font-(family-name:--font-display) text-xl font-semibold text-foreground">
                      {m.headline}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {m.detail}
                    </p>
                    <StatusRow status={m.status} />
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-2xl px-6 text-center text-sm text-[var(--text-muted)]">
              {DISCLOSURE_NOTE}
            </p>
          </div>
        );
      }}
    </StickyScene>
  );
}
