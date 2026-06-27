import { useState } from 'react';
import type { UserData } from '../types';

interface Props {
  userData: UserData;
  onClose: () => void;
  onSave: (updates: Partial<UserData>) => void;
}

export default function AccountPanel({ userData, onClose, onSave }: Props) {
  const [name, setName] = useState(userData.name || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({ name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userData.email, name }),
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm h-full bg-white shadow-2xl flex flex-col animate-panel-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Account</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* Avatar placeholder */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="7.5" r="3.5" />
                <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>

          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none px-4 py-3 text-sm text-gray-800 transition"
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              value={userData.email}
              readOnly
              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-400 cursor-default"
            />
          </div>

          {/* Stage */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Project stage</label>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              {userData.stage || '—'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
            }`}
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
