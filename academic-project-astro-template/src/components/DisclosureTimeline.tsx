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
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
      {ATTACKS.map((attack) => {
        const fixed = status[attack.id] === "fixed";
        return (
          <span key={attack.id} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: fixed
                  ? LEDGER_TOKENS.credit
                  : LEDGER_TOKENS.debit,
                filter: `drop-shadow(0 0 4px ${fixed ? LEDGER_TOKENS.credit : LEDGER_TOKENS.debit})`,
              }}
            />
            <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--text-muted)]">
              {attack.tag}
            </span>
            <span
              className="font-(family-name:--font-mono) text-xs tracking-wider uppercase"
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

function ChapterCard({
  milestone,
  index,
  count,
  active,
}: {
  milestone: (typeof MILESTONES)[number];
  index: number;
  count: number;
  active: boolean;
}) {
  return (
    <div
      className="rounded-2xl border bg-card p-6 sm:p-7"
      style={{
        borderColor: active ? "var(--border)" : "var(--border)",
        boxShadow: active
          ? "0 24px 64px rgb(0 0 0 / 0.38), 0 0 0 1px rgb(255 255 255 / 0.04) inset"
          : "0 8px 24px rgb(0 0 0 / 0.18)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] uppercase"
          style={{ color: LEDGER_TOKENS.provisional }}
        >
          {milestone.label}
        </span>
        <span className="font-(family-name:--font-mono) text-[0.65rem] tabular-nums tracking-wider text-[var(--text-muted)]">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-3 font-(family-name:--font-display) text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {milestone.headline}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
        {milestone.detail}
      </p>
      <StatusRow status={milestone.status} />
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
              <div className="mb-6">
                <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
                  Disclosure
                </span>
                <p className="mt-1 font-(family-name:--font-display) text-sm text-[var(--text-secondary)]">
                  April 2025 → January 2026
                </p>
              </div>
              <ol className="space-y-5">
                {MILESTONES.map((m, i) => (
                  <li key={m.id}>
                    <ChapterCard
                      milestone={m}
                      index={i}
                      count={count}
                      active
                    />
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm leading-relaxed text-[var(--text-muted)]">
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
        const fill = clamp01(offset / (count - 1));

        return (
          <div className="w-full overflow-hidden">
            <div className="mx-auto mb-3 flex max-w-4xl items-baseline justify-between px-6">
              <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
                Disclosure
              </span>
              <span className="font-(family-name:--font-mono) text-[0.65rem] text-[var(--text-muted)]">
                {MILESTONES[position.index].label}
              </span>
            </div>

            {/* the rail — fill is scaleX, never width */}
            <div className="relative mx-auto mb-10 h-px w-full max-w-4xl bg-border">
              <div
                className="absolute inset-y-0 left-0 w-full origin-left"
                style={{
                  transform: `scaleX(${fill})`,
                  background: LEDGER_TOKENS.accent,
                }}
              />
              {MILESTONES.map((m, i) => {
                const at = i / (count - 1);
                const reached = fill >= at - 0.001;
                const current = i === position.index;
                return (
                  <span
                    key={m.id}
                    className="absolute top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${at * 100}%`,
                      background: reached
                        ? LEDGER_TOKENS.accent
                        : "var(--border)",
                      transform: `translate(-50%, -50%) scale(${current ? 1.55 : 1})`,
                      boxShadow: current
                        ? `0 0 10px ${LEDGER_TOKENS.accent}`
                        : "none",
                      transition:
                        "transform 200ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out",
                    }}
                  />
                );
              })}
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
                    opacity: i === position.index ? 1 : 0.28,
                    filter:
                      i === position.index ? "none" : "saturate(0.6)",
                    transform: `scale(${i === position.index ? 1 : 0.96})`,
                    transition:
                      "opacity 200ms ease-out, filter 200ms ease-out, transform 200ms ease-out",
                  }}
                >
                  <ChapterCard
                    milestone={m}
                    index={i}
                    count={count}
                    active={i === position.index}
                  />
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-2xl px-6 text-center text-sm leading-relaxed text-[var(--text-muted)]">
              {DISCLOSURE_NOTE}
            </p>
          </div>
        );
      }}
    </StickyScene>
  );
}
