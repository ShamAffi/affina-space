import { useState } from 'react';
import type { UserData } from '../types';

interface Props {
  userData: UserData;
  onClose: () => void;
  onSave: (updates: Partial<UserData>) => void;
}

export default function AccountPanel({ userData, onClose, onSave }: Props) {
  const [name, setName] = useState(userData.name || '');
  const [projectName, setProjectName] = useState(userData.projectName || '');
  const [saved, setSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // SPEC_STRIPE §7 — hosted Customer Portal (cancel / card / invoices).
  async function openPortal() {
    setPortalLoading(true);
    try {
      const r = await fetch('/api/stripe?action=portal', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (d.url) { window.location.href = d.url; return; }
    } catch { /* fall through */ }
    setPortalLoading(false);
  }

  function handleSave() {
    onSave({ name, projectName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, projectName }),
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm h-full bg-surface shadow-2xl flex flex-col animate-panel-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-hairline">
          <h2 className="text-base font-bold text-ink">Account</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-soft transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* Avatar placeholder */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-hairline">
            <div className="w-16 h-16 rounded-pill bg-brand-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="7.5" r="3.5" />
                <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              </svg>
            </div>
            <p className="text-sm text-ink-soft">{userData.email}</p>
          </div>

          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-control border border-hairline bg-inset focus:bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink transition"
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Email</label>
            <input
              type="email"
              value={userData.email}
              readOnly
              className="rounded-control border border-hairline bg-inset px-4 py-3 text-sm text-ink-mute cursor-default"
            />
          </div>

          {/* Project name (editable) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-soft">Project name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Your project name"
              maxLength={60}
              className="rounded-control border border-hairline bg-inset focus:bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink transition"
            />
          </div>

          {/* Subscription (SPEC_STRIPE §7) — only for subscribers */}
          {userData.subscribed && (
            <div className="flex flex-col gap-1.5 pt-4 border-t border-hairline">
              <label className="text-sm font-semibold text-ink-soft">Subscription</label>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="text-left text-sm font-semibold text-brand hover:text-brand-700 disabled:opacity-50 transition"
              >
                {portalLoading ? 'Opening…' : 'Manage subscription →'}
              </button>
              <p className="text-xs text-ink-mute">Cancel, update your card, or view invoices.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-hairline">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-control font-semibold text-sm transition-all duration-150 ${
              saved
                ? 'bg-accent-600 text-white'
                : 'bg-brand hover:bg-brand-700 text-white active:scale-95'
            }`}
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
