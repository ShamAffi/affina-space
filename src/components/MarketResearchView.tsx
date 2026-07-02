import type { MarketResearchReport } from '../types';

// §1.7 — online document in PDF style: page-like sheet, brand-token typography,
// key-number highlights, callouts, mandatory test-mode label + feedback line.
const CONFIDENCE_CHIP: Record<string, string> = {
  high: 'bg-accent-50 text-accent-800',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-inset text-ink-soft',
};

interface Props {
  report: MarketResearchReport;
  projectName: string;
  onClose: () => void;
}

export default function MarketResearchView({ report, projectName, onClose }: Props) {
  const date = new Date(report.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 sm:p-8">
      {/* Top bar */}
      <div className="sticky top-0 z-10 max-w-3xl mx-auto flex justify-end mb-2">
        <button
          onClick={onClose}
          className="bg-surface border border-hairline rounded-pill px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink shadow-sm transition"
        >
          Close ✕
        </button>
      </div>

      {/* The "page" */}
      <div className="max-w-3xl mx-auto bg-surface rounded-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-hairline">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-1">Market Research</p>
              <h1 className="font-display text-3xl font-medium tracking-tight text-ink">{projectName || 'Your startup'}</h1>
              <p className="text-xs text-ink-mute mt-1">{date} · Snapshot Report</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-pill px-3 py-1.5">
              ⚠ Test mode — model estimates only, no live data
            </span>
          </div>

          {/* Verdict + key numbers */}
          <p className="text-sm text-ink leading-relaxed mt-5">{report.headlineVerdict}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {report.keyNumbers.map((k, i) => (
              <div key={i} className="bg-brand-50 border border-brand-100 rounded-control p-3">
                <p className="text-lg font-bold text-brand-800 leading-tight">{k.value}</p>
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider mt-0.5">{k.label}</p>
                <p className="text-[10px] text-ink-mute mt-1 leading-snug">{k.logic}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-ink-mute mt-4 leading-relaxed">
            Directional research to inform your decisions — not a substitute for them. Confidence levels inside.
          </p>
        </div>

        {/* Sections */}
        <div className="px-8 py-6 flex flex-col gap-7">
          {report.sections.map((s, i) => (
            <section key={i}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-bold text-ink">{i}. {s.title}</h2>
                <span className={`text-[9px] font-bold uppercase tracking-wider rounded-pill px-2 py-0.5 ${CONFIDENCE_CHIP[s.confidence]}`}>
                  {s.confidence}
                </span>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{s.body}</p>
              {s.warning && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-control px-4 py-3">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">⚠ Challenges your hypothesis</p>
                  <p className="text-sm text-ink-soft leading-relaxed">{s.warning}</p>
                </div>
              )}
              <div className="mt-3 bg-brand-50 border border-brand-100 rounded-control px-4 py-2.5">
                <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider mb-0.5">What this means for you</p>
                <p className="text-sm text-ink leading-relaxed">{s.whatThisMeans}</p>
              </div>
            </section>
          ))}
        </div>

        {/* §1.7 feedback footer — mandatory (fully automated pipeline) */}
        <div className="px-8 py-5 border-t border-hairline bg-inset/50">
          <p className="text-[11px] text-ink-mute leading-relaxed">
            This report was generated automatically for your project. Something looks off or doesn't match
            your reality? Tell us — we'll gladly review and re-run it.{' '}
            <a href="mailto:sk@affina.space?subject=Discuss my research report" className="font-semibold text-brand hover:text-brand-700">
              Discuss this report →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
