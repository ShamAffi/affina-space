import { useState } from 'react';
import { PROGRAMS, type Program } from '../programs';
import { DOCS, openDoc } from '../docs';

// Programs catalog (SPEC_PROGRAMS_PAGE) — the Launch Program + 4 "coming soon" specialized
// courses, 3 per row with roomy gaps, plus a Resources section listing the DOCS library.
// Launch → LMS; specialized → a preview panel with the module outline.
interface Props {
  onGoToLMS: () => void;
  onBack: () => void;
  phone?: string | null;   // amendment 2026-07-16: gates lead-magnet docs (gate:'phone') in Resources
}

export default function Programs({ onGoToLMS, onBack, phone }: Props) {
  const [preview, setPreview] = useState<Program | null>(null);
  // Display gate (SPEC_DOCS_LIBRARY amendment): a gate:'phone' doc shows only once she's given a
  // number (any source — guide popup or paywall). Ungated docs always show. Zero visible → the
  // whole Resources section (header included) hides.
  const visibleDocs = DOCS.filter((d) => d.gate !== 'phone' || !!phone);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <button onClick={onBack} className="text-sm text-ink-mute hover:text-ink-soft transition mb-6 inline-flex items-center gap-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          Dashboard
        </button>

        <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink mb-2">Programs</h1>
        <p className="text-base text-ink-soft mb-10">Your Launch Program, plus deep-dives to go further.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {PROGRAMS.map((p) => {
            const isLaunch = p.status === 'in_progress';
            return (
              <button
                key={p.id}
                onClick={() => (isLaunch ? onGoToLMS() : setPreview(p))}
                className="group text-left bg-surface border border-hairline rounded-card overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
              >
                {/* Placeholder image (brand tint — Shamil swaps real assets later) */}
                <div className={`h-32 ${p.tint} relative`}>
                  <span className={`absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider rounded-pill px-2 py-0.5 ${isLaunch ? 'bg-accent-600 text-white' : 'bg-surface/90 text-ink-soft'}`}>
                    {isLaunch ? 'In progress' : 'Coming soon'}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-700 mb-1.5">{p.category}</span>
                  <h3 className="text-base font-bold text-ink leading-snug mb-1">{p.name}</h3>
                  <p className="text-xs text-ink-soft leading-relaxed mb-3 flex-1">{p.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-ink-mute">
                    <span>{p.moduleCount} modules</span>
                    <span className="font-semibold text-brand group-hover:translate-x-0.5 transition-transform">
                      {isLaunch ? 'Continue →' : 'Preview →'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Resources — the DOCS library (SPEC_DOCS_LIBRARY §3 + amendment: gated docs hidden until phone) */}
        {visibleDocs.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink mb-1">Resources</h2>
            <p className="text-sm text-ink-soft mb-6">Free guides and playbooks to keep.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleDocs.map((d) => (
                <button
                  key={d.slug}
                  onClick={() => openDoc(d.slug)}
                  className="text-left bg-surface border border-hairline rounded-card p-4 shadow-sm hover:shadow-md transition flex items-start gap-3"
                >
                  <span className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-control bg-brand-50 flex items-center justify-center text-brand">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{d.title}</span>
                    <span className="block text-xs text-ink-soft leading-relaxed">{d.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coming-soon preview panel */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
          <div className="relative z-10 w-full max-w-lg bg-surface rounded-card shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-hairline">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">{preview.category} · Coming soon</span>
                <h3 className="text-lg font-bold text-ink mt-0.5">{preview.name}</h3>
                <p className="text-sm text-ink-soft mt-0.5">{preview.tagline}</p>
              </div>
              <button onClick={() => setPreview(null)} className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-mute transition flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-3">What you'll cover</p>
              <ol className="space-y-2.5">
                {(preview.modules ?? []).map((m, i) => (
                  <li key={m} className="flex gap-3 text-sm text-ink-soft leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-pill bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-hairline text-center">
              <p className="text-sm text-ink-soft">Full lessons coming soon — included with your subscription when they ship.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
