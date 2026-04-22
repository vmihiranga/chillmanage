'use client';

import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm overflow-hidden bg-white shadow-2xl rounded-3xl animate-slide-up border border-gray-100">
        <div className="px-8 py-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-2xl shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm font-medium text-gray-400">Please enter the administrator password to access management tools.</p>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full px-5 py-4 text-center text-lg font-bold tracking-widest text-gray-800 transition-all border border-gray-100 bg-gray-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 text-sm font-bold text-gray-400 transition-colors hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-3 px-8 py-3.5 text-sm font-black text-white bg-orange-500 rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2 grow"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
