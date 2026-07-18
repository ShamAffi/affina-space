import { useState, useEffect, useRef } from 'react';
import { track } from '../lib/analytics';

// SPEC_VENTURE_REPORT §3 — "Your First Venture Report" at m0l5. Deliberately an EDITORIAL
// analyst memo (titled prose sections, large hero numbers, pull-quotes of her own words,
// document feel) — NOT the dashboard/RevealTeaser look. Generated once on MODELS.deep and
// cached server-side; the CTA opens the founding-cohort paywall.

type VentureReport = {
  verdict: { oneLiner: string; verdict: string; level: { n: number; name: string } };
  opportunity: { frame: string; numbers: { label: string; hero: string; support: string }[]; whyNow: string };
  whyYouCanWin: { point: string; quote: string }[];
  whatsMissing: { gap: string; solvableAs: string }[];
  risks: { text: string; whyNow: string }[];
  path: string;
};

interface Props {
  projectName: string;
  name: string;
  onReportReady: () => void;    // mark m0l5 complete once she's seen the report
  onJoinCohort: () => void;     // → the cohort paywall
}

function SectionRule({ label, n }: { label: string; n: string }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-hairline pt-3 mb-4">
      <span className="font-display text-sm text-brand-400">{n}</span>
      <h2 className="text-xs uppercase tracking-[0.18em] font-bold text-ink-soft">{label}</h2>
    </div>
  );
}

// Nobody likes one giant wall of text: use the AI's blank-line breaks when present, else split a
// single block into ~2 balanced paragraphs at a sentence boundary (handles reports cached before
// the paragraph prompt, or a model that returns one block).
function toParagraphs(text: string): string[] {
  const byBlank = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (byBlank.length >= 2) return byBlank;
  const sentences = (byBlank[0] ?? text).replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (!sentences || sentences.length < 2) return byBlank.length ? byBlank : [text.trim()];
  const mid = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, mid).join('').trim(), sentences.slice(mid).join('').trim()];
}

export default function VentureReportBlock({ projectName, name, onReportReady, onJoinCohort }: Props) {
  const [report, setReport] = useState<VentureReport | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const r = await fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'venture-report' }),
        });
        if (!r.ok) throw new Error('api');
        const d = await r.json();
        if (!d.report) throw new Error('empty');
        setReport(d.report);
        setStatus('ready');
        track('venture_report_viewed');
        onReportReady();
      } catch {
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-pill bg-brand animate-orb-pulse" />
        <p className="text-sm font-semibold text-ink-soft tracking-wide">Analyzing your venture…</p>
        <p className="text-xs text-ink-mute">Reading your answers and running the numbers</p>
      </div>
    );
  }

  if (status === 'error' || !report) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-ink-soft mb-4">We couldn't build your report just now.</p>
        <button
          onClick={() => { started.current = false; setStatus('loading'); setAttempt((a) => a + 1); }}
          className="bg-brand hover:bg-brand-700 text-white text-sm font-semibold px-6 py-3 rounded-pill transition active:scale-95"
        >
          Try again
        </button>
      </div>
    );
  }

  const lvl = report.verdict.level;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Masthead — document feel */}
      <div className="border-b-2 border-ink/10 pb-4 mb-8">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink-mute font-semibold">
          <span>Venture Report</span>
          <span>Affina · Confidential</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink mt-3 leading-tight">{projectName || 'Your venture'}</h1>
        <p className="text-sm text-ink-mute mt-1">Prepared for {name || 'you'}</p>
      </div>

      {/* 1 — Verdict hero */}
      <section className="mb-10">
        {report.verdict.oneLiner && (
          <p className="font-display text-xl sm:text-2xl text-ink leading-snug">{report.verdict.oneLiner}</p>
        )}
        {report.verdict.verdict && (
          <p className="text-[15px] text-ink leading-relaxed mt-3">{report.verdict.verdict}</p>
        )}
        {lvl?.name && (
          <div className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-pill px-3 py-1.5">
            Readiness · L{lvl.n} {lvl.name}
          </div>
        )}
      </section>

      {/* 2 — The Opportunity */}
      <SectionRule label="The Opportunity" n="01" />
      <section className="mb-10">
        {report.opportunity.numbers.length > 0 && (
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline my-2">
            {report.opportunity.numbers.map((num, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <p className="font-display text-2xl sm:text-3xl text-brand-700 font-medium leading-tight tracking-tight shrink-0 w-36 line-clamp-2">{num.hero}</p>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-ink-mute font-semibold">{num.label}</p>
                  {num.support && <p className="text-sm text-ink-soft leading-relaxed mt-0.5">{num.support}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {report.opportunity.whyNow && <p className="text-[15px] text-ink leading-relaxed mt-5">{report.opportunity.whyNow}</p>}
        <p className="text-[11px] text-ink-mute mt-4 leading-relaxed">These are napkin numbers — the optimistic case if you hit it, not a promise.</p>
      </section>

      {/* 3 — Why you can win */}
      {report.whyYouCanWin.length > 0 && (
        <>
          <SectionRule label="Why you can win" n="02" />
          <section className="mb-10 flex flex-col gap-5">
            {report.whyYouCanWin.map((w, i) => (
              <div key={i}>
                <p className="text-[15px] text-ink leading-relaxed">{w.point}</p>
                {w.quote && <p className="border-l-2 border-brand-300 pl-3 mt-2 text-sm italic text-ink-soft">“{w.quote}”</p>}
              </div>
            ))}
          </section>
        </>
      )}

      {/* 4 — What's missing */}
      {report.whatsMissing.length > 0 && (
        <>
          <SectionRule label="What's missing" n="03" />
          <section className="mb-10 flex flex-col gap-4">
            {report.whatsMissing.map((g, i) => (
              <div key={i}>
                <p className="text-[15px] text-ink leading-relaxed">{g.gap}</p>
                {g.solvableAs && <p className="text-sm text-ink-soft leading-relaxed mt-1">{g.solvableAs}</p>}
              </div>
            ))}
          </section>
        </>
      )}

      {/* 5 — Risks */}
      {report.risks.length > 0 && (
        <>
          <SectionRule label="Risks" n="04" />
          <section className="mb-10 flex flex-col gap-4">
            {report.risks.map((r, i) => (
              <div key={i}>
                <p className="text-[15px] text-ink leading-relaxed">{r.text}</p>
                {r.whyNow && <p className="text-sm text-ink-soft leading-relaxed mt-1"><span className="font-medium">Why it matters:</span> {r.whyNow}</p>}
              </div>
            ))}
          </section>
        </>
      )}

      {/* 6 — The Path + CTA */}
      {report.path && (
        <>
          <SectionRule label="The Path" n="05" />
          <section className="mb-8 flex flex-col gap-3">
            {toParagraphs(report.path).map((para, i) => (
              <p key={i} className="text-[15px] text-ink leading-relaxed">{para}</p>
            ))}
          </section>
        </>
      )}

      <button
        onClick={onJoinCohort}
        className="w-full bg-brand hover:bg-brand-700 active:scale-[0.98] text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
      >
        Turn this into a real business →
      </button>
    </div>
  );
}
