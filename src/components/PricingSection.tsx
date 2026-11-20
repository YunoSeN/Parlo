import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { EditorialTextReveal } from "./EditorialTextReveal";
import { GlowCtaButton } from "./GlowCtaButton";
import { GlowingEdgeCard } from "./GlowingEdgeCard";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { OdometerNumber } from "./OdometerNumber";
import { RolodexWord } from "./RolodexWord";
import { TiltCard3D } from "./TiltCard3D";

type BillingCycle = "annual" | "monthly";

export interface PricingSectionProps {
  onBookCall?: (planId: string) => void;
  activePlanId?: string;
  activeLanguageCode?: string;
  categoryFont?: CountryFontSpec;
  onSelectLanguage?: (code: string) => void;
  className?: string;
}

interface ComparisonRow {
  category: string;
  feature: string;
  listener: string;
  conversationalist: string;
  cohort: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    category: "Live Voice & Immersion",
    feature: "Real-time voice conversation minutes",
    listener: "20 min / week",
    conversationalist: "Unlimited",
    cohort: "Unlimited per seat",
  },
  {
    category: "Live Voice & Immersion",
    feature: "Languages & CEFR calibration (A2–C1)",
    listener: "All 8 languages",
    conversationalist: "All 8 languages",
    cohort: "All 8 + custom rubrics",
  },
  {
    category: "Live Voice & Immersion",
    feature: "Curated & custom scenario builder",
    listener: "4 starter scenes",
    conversationalist: "Full catalog + custom",
    cohort: "Syllabus-matched scenes",
  },
  {
    category: "Coaching & Spatial Practice",
    feature: "Turn-by-turn natural phrasing coach",
    listener: "On-demand checks",
    conversationalist: "Live automatic coaching",
    cohort: "Live + rubric alignment",
  },
  {
    category: "Coaching & Spatial Practice",
    feature: "Interactive 3D Spatial Stage",
    listener: "Preview mode",
    conversationalist: "Full 3D immersion",
    cohort: "Full 3D immersion",
  },
  {
    category: "Progress & Cohort Controls",
    feature: "Daily streak, weekly goals & Phrasebook",
    listener: "Up to 50 phrases",
    conversationalist: "Unlimited + cloud sync",
    cohort: "Unlimited + cohort analytics",
  },
];

const FAQ_ITEMS = [
  {
    q: "What if I am at an A2 level and get stuck mid-sentence?",
    a: "Every conversation tunes vocabulary and speaking pace to your selected CEFR level (A2–C1). You can switch to Slow pace, translate any partner turn inline, or tap Suggest Reply for three context-aware responses.",
  },
  {
    q: "Will live coaching interrupt me every time I make a small mistake?",
    a: "No. You choose between Gentle, Active, or Immersive correction styles. Phrasing refinements appear quietly in the side Coaching Deck while you keep speaking naturally.",
  },
  {
    q: "How is my voice handled, and can I practice without a microphone?",
    a: "Audio streams through Parlo’s server proxy rather than exposing keys in the browser. If a microphone is unavailable or you are in a quiet space, you can switch seamlessly to typed conversation turns.",
  },
  {
    q: "How is Parlo different from flashcard apps or private tutors?",
    a: "Flashcards train passive recognition; tutors require scheduling and high hourly rates. Parlo bridges the gap with immediate, judgment-free daily speaking rehearsal backed by structured debriefs.",
  },
  {
    q: "Can I start free, sync across devices, and cancel anytime?",
    a: "Yes. Listener is free forever with 20 speaking minutes each week. Sign in with Google to sync your streak, weekly goals, and Phrasebook across devices, and upgrade or cancel Conversationalist anytime with a 14-day fluency guarantee.",
  },
];

export function PricingSection({
  onBookCall,
  activePlanId = "starter",
  activeLanguageCode = "es",
  categoryFont,
  className = "",
}: PricingSectionProps) {
  const activeCulture = getCultureByLanguage(activeLanguageCode);
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const [selectedPlan, setSelectedPlan] = useState<string>(activePlanId);
  const [cohortSeats, setCohortSeats] = useState<number>(15);
  const [teamEmail, setTeamEmail] = useState("");
  const [teamSubmitted, setTeamSubmitted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [showCompare, setShowCompare] = useState<boolean>(false);

  const plusPrice = billing === "annual" ? 14 : 18;
  const plusAnnualTotal = 14 * 12;

  const cohortPricing = useMemo(() => {
    const basePerSeat =
      cohortSeats >= 50 ? 9 : cohortSeats >= 25 ? 10 : 12;
    const perSeat = billing === "annual" ? basePerSeat : basePerSeat + 3;
    const discountLabel =
      cohortSeats >= 50
        ? "Volume tier · 25% institutional discount"
        : cohortSeats >= 25
        ? "Department tier · 17% cohort discount"
        : "Standard cohort rate · 5–24 seats";
    return {
      perSeat,
      monthlyTotal: perSeat * cohortSeats,
      discountLabel,
    };
  }, [billing, cohortSeats]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setTeamSubmitted(false);
    onBookCall?.(planId);
  };

  return (
    <div
      className={`max-w-[1200px] mx-auto px-6 py-8 text-[var(--parlo-ink)] ${className}`}
    >
      {/* Cultural Editorial Page Header matching ReviewView & ScenariosView */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] parlo-machined-frame p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div
          aria-hidden="true"
          data-culture={activeLanguageCode}
          className="parlo-motif-overlay parlo-motif-header"
        />
        <CulturalMotifArt
          languageCode={activeLanguageCode}
          variant="ambient"
          className="hidden md:block absolute right-48 -bottom-6 w-36 h-36 z-0"
        />
        <div className="relative z-10">
          <p className="flex flex-wrap items-center gap-2 font-tech text-[10px] uppercase tracking-[0.22em] text-[var(--parlo-ink-muted)] font-semibold">
            <LanguageFlagBadge code={activeLanguageCode} size="xs" />
            <span className="text-[var(--parlo-primary)]">
              {activeCulture.atelierName}
            </span>
            <span aria-hidden="true">·</span>
            <span>Membership & Studio Plans</span>
            {categoryFont && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[var(--parlo-ink-secondary)]">
                  Type: {categoryFont.city}
                </span>
              </>
            )}
          </p>
          <h1
            className="mt-2.5 text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.08] text-[var(--parlo-ink)]"
            style={
              categoryFont
                ? {
                    fontFamily: categoryFont.fontFamily,
                    fontStyle: categoryFont.fontStyle,
                    letterSpacing: categoryFont.letterSpacing,
                  }
                : undefined
            }
          >
            <EditorialTextReveal text="Invest in" delay={0.03} />{" "}
            <RolodexWord
              words={[
                "real spoken fluency",
                "daily speaking rhythm",
                "natural phrasing",
                "calm confidence",
              ]}
              className="italic text-[var(--parlo-primary)]"
            />
          </h1>
          <p className="mt-2 text-base text-[var(--parlo-ink-secondary)] max-w-2xl leading-relaxed">
            Transparent categories matched to how you practice—start free to build a daily streak, unlock unlimited live voice coaching, or run structured language cohorts.
          </p>
        </div>

        {/* Tactile Billing Cycle Toggle with recessed well & keycap thumb */}
        <div
          className="relative z-10 inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] parlo-well-recessed rounded-xl shrink-0 self-start md:self-auto"
          role="group"
          aria-label="Billing frequency"
        >
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`relative px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              billing === "monthly"
                ? "text-[var(--parlo-on-solid)]"
                : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
            }`}
          >
            {billing === "monthly" && (
              <motion.span
                layoutId="parlo-billing-pill"
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-[var(--parlo-primary)] parlo-keycap-thumb"
              />
            )}
            <span className="relative z-10">Monthly</span>
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              billing === "annual"
                ? "text-[var(--parlo-on-solid)]"
                : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
            }`}
          >
            {billing === "annual" && (
              <motion.span
                layoutId="parlo-billing-pill"
                transition={{ type: "spring", stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-lg bg-[var(--parlo-primary)]"
              />
            )}
            <span className="relative z-10">Annual</span>
            <span
              className={`relative z-10 font-mono text-[11px] ${
                billing === "annual"
                  ? "text-[var(--parlo-on-solid)]/85"
                  : "text-[var(--parlo-accent)]"
              }`}
            >
              −22%
            </span>
          </button>
        </div>
      </div>

      {/* Inline Selection / Cohort Walkthrough Confirmation Strip */}
      {selectedPlan && (
        <div className="mt-6 bg-[var(--parlo-surface)] border border-[var(--parlo-accent-border)] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="w-5 h-5 text-[var(--parlo-accent)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-[var(--parlo-ink)]">
                {selectedPlan === "schools-teams"
                  ? `Immersion Studio selected (${cohortSeats} seats · $${cohortPricing.monthlyTotal}/mo)`
                  : selectedPlan === "parlo-plus"
                  ? `Conversationalist selected ($${plusPrice}/mo ${billing === "annual" ? "billed annually" : "monthly"})`
                  : "Listener (Free) is active in your studio"}
              </p>
              <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
                {selectedPlan === "schools-teams"
                  ? teamSubmitted
                    ? "Your institutional walkthrough request is recorded. We will follow up with cohort setup options."
                    : "Share your work or university email to schedule a custom scenario and seat-management walkthrough."
                  : "All voice sessions, daily streaks, weekly targets, and Phrasebook cards are ready in your studio."}
              </p>
            </div>
          </div>

          {selectedPlan === "schools-teams" && !teamSubmitted && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (teamEmail.trim()) setTeamSubmitted(true);
              }}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0"
            >
              <input
                type="email"
                required
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                placeholder="director@academy.edu"
                aria-label="Work or academic email"
                className="px-3 py-2 text-xs bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] rounded-lg text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] focus:outline-2 focus:outline-[var(--parlo-primary)] min-w-[210px]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Request Walkthrough
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3-Column Editorial Pricing Architecture with 3D Perspective Tilt */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Category 01: Listener (Free) */}
        <TiltCard3D
          maxTilt={4.5}
          magneticPull={4}
          hoverScale={1.01}
          glare={true}
          className={`bg-[var(--parlo-surface)] rounded-2xl border flex flex-col overflow-hidden transition-colors shadow-sm hover:shadow-xl ${
            selectedPlan === "starter"
              ? "border-[var(--parlo-primary)]"
              : "border-[var(--parlo-border)] hover:border-[var(--parlo-primary)]/55"
          }`}
        >
          <div className="p-6 border-b border-[var(--parlo-border)]">
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-[var(--parlo-ink-muted)]">
              <span>01 · INDIVIDUAL</span>
              <span>FREE FOREVER</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--parlo-ink)]">
              Listener
            </h2>
            <p className="mt-1.5 text-sm text-[var(--parlo-ink-muted)] leading-relaxed">
              Build a consistent daily speaking ritual across all 8 languages before committing.
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-semibold tracking-tight text-[var(--parlo-ink)] tabular-nums">
                $0
              </span>
              <span className="text-xs font-mono text-[var(--parlo-ink-muted)]">
                / month
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--parlo-ink-muted)]">
              No card required · 20 speaking min / week
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <ul className="space-y-3.5 text-sm text-[var(--parlo-ink-secondary)]">
              {[
                "20 minutes of live real-time voice practice every week",
                "All 8 languages with A2–C1 CEFR tuning & pace control",
                "4 curated real-world immersion scenarios",
                "Daily streak tracker, weekly goal widget & 50-card Phrasebook",
                "On-demand turn translations & pronunciation playback",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] flex items-center justify-center shrink-0">
                    <Check
                      className="w-2.5 h-2.5 text-[var(--parlo-primary)] stroke-[3]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[var(--parlo-border)]">
              <button
                type="button"
                onClick={() => handlePlanSelect("starter")}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                  selectedPlan === "starter"
                    ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)]"
                    : "bg-[var(--parlo-canvas)] border-[var(--parlo-border)] text-[var(--parlo-ink)] hover:border-[var(--parlo-ink)]"
                }`}
              >
                <span>
                  {selectedPlan === "starter"
                    ? "Active Plan — Open Studio"
                    : "Start Practicing Free"}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </TiltCard3D>

        {/* Category 02: Conversationalist (Raycast-Inspired Architecturally Raised Center Plan) */}
        <GlowingEdgeCard
          introSweep
          className="h-full lg:-mt-3 lg:mb-3"
          contentClassName={`border-2 ${
            selectedPlan === "parlo-plus"
              ? "border-[var(--parlo-primary)]"
              : "border-[var(--parlo-primary)]/85"
          }`}
        >
          <div className="px-6 py-2.5 bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] flex items-center justify-between text-xs font-mono">
            <span>02 · MOST POPULAR</span>
            <span>FOUNDING RATE</span>
          </div>

          <div className="relative overflow-hidden p-6 bg-[var(--parlo-primary-soft)]/55 border-b border-[var(--parlo-border)]">
            <div
              aria-hidden="true"
              data-culture={activeLanguageCode}
              className="parlo-motif-overlay parlo-motif-corner"
            />
            <h2 className="relative z-10 font-display text-2xl font-semibold text-[var(--parlo-ink)]">
              Conversationalist
            </h2>
            <p className="relative z-10 mt-1.5 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
              Unlimited live voice immersion, instant natural-phrasing feedback, and 3D spatial practice.
            </p>

            <div className="relative z-10 mt-6 flex items-baseline flex-wrap gap-2">
              {billing === "annual" && (
                <span className="font-mono text-xl text-[var(--parlo-ink-muted)] line-through tabular-nums">
                  $18
                </span>
              )}
              <OdometerNumber
                value={plusPrice}
                prefix="$"
                className="font-mono text-4xl font-semibold tracking-tight text-[var(--parlo-ink)]"
              />
              <span className="text-xs font-mono text-[var(--parlo-ink-muted)]">
                / month
              </span>
            </div>
            <p className="relative z-10 mt-2 text-xs font-medium text-[var(--parlo-accent)] tabular-nums">
              {billing === "annual"
                ? `Billed $${plusAnnualTotal}/year · saves $48 annually`
                : "Switch to Annual to save $48/year · 14-day fluency guarantee"}
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <ul className="space-y-3.5 text-sm text-[var(--parlo-ink-secondary)]">
              {[
                "Unlimited real-time voice conversations with all 5 studio personas",
                "Automatic turn-by-turn grammar & natural phrasing coaching",
                "Full interactive 3D Spatial Stage & unlimited custom scenario builder",
                "Structured post-session debriefs, talk-time charts & unlimited Phrasebook",
                "Automatic cross-device cloud sync with Google Sign-In",
                "14-day full refund guarantee if your speaking confidence doesn't grow",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--parlo-accent)] flex items-center justify-center shrink-0">
                    <Check
                      className="w-2.5 h-2.5 text-[var(--parlo-on-solid)] stroke-[3]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[var(--parlo-border)]">
              <GlowCtaButton
                onClick={() => handlePlanSelect("parlo-plus")}
                className="w-full"
              >
                {selectedPlan === "parlo-plus"
                  ? "Selected — Open Studio"
                  : "Choose Conversationalist"}
              </GlowCtaButton>
            </div>
          </div>
        </GlowingEdgeCard>

        {/* Category 03: Immersion Studio (Cohorts, Schools & Teams) */}
        <TiltCard3D
          maxTilt={4.5}
          magneticPull={4}
          hoverScale={1.01}
          glare={true}
          className={`bg-[var(--parlo-surface)] rounded-2xl border flex flex-col overflow-hidden transition-colors shadow-sm hover:shadow-xl ${
            selectedPlan === "schools-teams"
              ? "border-[var(--parlo-primary)]"
              : "border-[var(--parlo-border)] hover:border-[var(--parlo-primary)]/55"
          }`}
        >
          <div className="p-6 border-b border-[var(--parlo-border)]">
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-[var(--parlo-ink-muted)]">
              <span>03 · COHORTS & SCHOOLS</span>
              <span>5–100+ SEATS</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--parlo-ink)]">
              Immersion Studio
            </h2>
            <p className="mt-1.5 text-sm text-[var(--parlo-ink-muted)] leading-relaxed">
              Equip language departments, academies, or global teams with shared speaking benchmarks.
            </p>

            <div className="mt-6 flex items-baseline flex-wrap gap-2">
              <OdometerNumber
                value={cohortPricing.perSeat}
                prefix="$"
                className="font-mono text-4xl font-semibold tracking-tight text-[var(--parlo-ink)]"
              />
              <span className="text-xs font-mono text-[var(--parlo-ink-muted)]">
                / seat / month
              </span>
            </div>

            {/* Interactive Live Seat Estimator */}
            <div className="mt-4 p-3 rounded-lg bg-[var(--parlo-canvas)] border border-[var(--parlo-border)]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[var(--parlo-ink)]">
                  Estimate cohort size
                </span>
                <div className="inline-flex items-center gap-1.5 font-mono text-[var(--parlo-ink)] tabular-nums">
                  <button
                    type="button"
                    onClick={() => setCohortSeats((s) => Math.max(5, s - 5))}
                    aria-label="Decrease seats by 5"
                    className="w-6 h-6 rounded border border-[var(--parlo-border)] bg-[var(--parlo-surface)] inline-flex items-center justify-center hover:border-[var(--parlo-ink)] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <span className="min-w-[54px] text-center font-medium">
                    {cohortSeats} seats
                  </span>
                  <button
                    type="button"
                    onClick={() => setCohortSeats((s) => Math.min(100, s + 5))}
                    aria-label="Increase seats by 5"
                    className="w-6 h-6 rounded border border-[var(--parlo-border)] bg-[var(--parlo-surface)] inline-flex items-center justify-center hover:border-[var(--parlo-ink)] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={cohortSeats}
                onChange={(e) => setCohortSeats(Number(e.target.value))}
                aria-label="Cohort seat count"
                className="mt-2.5 w-full accent-[var(--parlo-primary)] cursor-pointer"
              />

              <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[var(--parlo-ink-muted)] tabular-nums">
                <span>{cohortPricing.discountLabel}</span>
                <OdometerNumber
                  value={cohortPricing.monthlyTotal}
                  prefix="$"
                  suffix="/mo"
                  className="font-semibold text-[var(--parlo-ink)]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <ul className="space-y-3.5 text-sm text-[var(--parlo-ink-secondary)]">
              {[
                "Every Conversationalist capability for every learner or team member",
                "Custom scenario libraries tailored to your syllabus or workplace domain",
                "Cohort talk-time progression, daily streak & CEFR readiness reports",
                "Dedicated pedagogical onboarding & voice persona configuration",
                "Automatic 17–25% volume pricing built directly into seat tiers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] flex items-center justify-center shrink-0">
                    <Check
                      className="w-2.5 h-2.5 text-[var(--parlo-primary)] stroke-[3]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[var(--parlo-border)]">
              <GlowCtaButton
                variant="ink"
                onClick={() => handlePlanSelect("schools-teams")}
                className="w-full"
              >
                Request Cohort Walkthrough
              </GlowCtaButton>
            </div>
          </div>
        </TiltCard3D>
      </div>

      {/* Expandable Full Capability Comparison Matrix */}
      <section className="mt-10 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCompare((prev) => !prev)}
          aria-expanded={showCompare}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--parlo-canvas)]/60 transition-colors cursor-pointer"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--parlo-ink)]">
              Compare All Capabilities
            </h2>
            <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
              Side-by-side breakdown across voice minutes, coaching depth, 3D stage, and cohort reporting
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--parlo-ink-muted)] transition-transform ${
              showCompare ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence initial={false}>
          {showCompare && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-[var(--parlo-border)] overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[var(--parlo-canvas)]/70 border-b border-[var(--parlo-border)] text-xs font-mono text-[var(--parlo-ink-muted)]">
                      <th className="py-3 px-6 font-medium">Capability</th>
                      <th className="py-3 px-4 font-medium">Listener</th>
                      <th className="py-3 px-4 font-medium text-[var(--parlo-primary)]">
                        Conversationalist
                      </th>
                      <th className="py-3 px-6 font-medium">Immersion Studio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--parlo-border)]/70">
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.feature} className="hover:bg-[var(--parlo-canvas)]/35">
                        <td className="py-3.5 px-6">
                          <span className="block text-xs font-mono text-[var(--parlo-ink-muted)]">
                            {row.category}
                          </span>
                          <span className="text-sm font-medium text-[var(--parlo-ink)]">
                            {row.feature}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[var(--parlo-ink-muted)]">
                          {row.listener}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[var(--parlo-ink)]">
                          {row.conversationalist}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-[var(--parlo-ink-secondary)]">
                          {row.cohort}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 5-Question Objection-Handling FAQ Accordion */}
      <section aria-label="Frequently asked questions" className="mt-10">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-semibold text-[var(--parlo-ink)]">
            Questions before you start speaking
          </h2>
          <p className="mt-1 text-sm text-[var(--parlo-ink-muted)]">
            Straight answers on proficiency tuning, live corrections, audio privacy, and billing.
          </p>
        </div>

        <div className="bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl divide-y divide-[var(--parlo-border)]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--parlo-canvas)]/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-[var(--parlo-ink)]">
                    <span className="font-mono text-xs text-[var(--parlo-accent)] mr-2.5">
                      0{idx + 1}.
                    </span>
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`w-7 h-7 rounded-full border inline-flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)] text-[var(--parlo-on-solid)]"
                        : "bg-[var(--parlo-surface-alt)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default PricingSection;
