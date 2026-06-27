import { useEffect, useRef } from 'react';

interface Props {
  avatarPing: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAccount: () => void;
  onDocuments: () => void;
}

export default function ProfileButton({
  avatarPing,
  menuOpen,
  onToggleMenu,
  onAccount,
  onDocuments,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (menuOpen) onToggleMenu();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen, onToggleMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggleMenu}
        className={`w-9 h-9 rounded-full bg-purple-50 border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-100 hover:border-purple-400 transition-all duration-150 ${
          avatarPing ? 'animate-avatar-ping' : ''
        }`}
        aria-label="Profile"
      >
        {/* Female silhouette icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="7.5" r="3.2" />
          <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" />
          <path d="M9.5 14.5c0 1.5-.5 2.5-1.5 3.5M14.5 14.5c0 1.5.5 2.5 1.5 3.5" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
          <button
            onClick={() => { onAccount(); onToggleMenu(); }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
            Account
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          <button
            onClick={() => { onDocuments(); onToggleMenu(); }}
            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </svg>
            Documents
          </button>
        </div>
      )}
    </div>
  );
}
