import React, { useState } from 'react';
import { UserX, X, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface BlockModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onConfirmBlock: (blockedUser: UserProfile, reason?: string) => Promise<void> | void;
}

export const BlockModal: React.FC<BlockModalProps> = ({ user, onClose, onConfirmBlock }) => {
  const [reason, setReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  if (!user) return null;

  const handleConfirm = async () => {
    setBlocking(true);
    try {
      await onConfirmBlock(user, reason.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to block user', err);
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          disabled={blocking}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 flex-shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Block @{user.handle}?</h3>
            <p className="text-xs text-slate-400">{user.displayName}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 space-y-2 mb-4 leading-relaxed">
          <div className="font-semibold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Blocking will permanently:</span>
          </div>
          <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px] pl-1">
            <li>End any existing connection with this user</li>
            <li>Cancel any pending connection requests</li>
            <li>Lock all chat messages and hide conversation history</li>
            <li>Prevent this user from seeing your profile in Discovery</li>
          </ul>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 block mb-1">
            Reason for block (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Unsolicited messages, uncomfortable interactions"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={blocking}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={blocking}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20"
          >
            {blocking ? 'Blocking...' : 'Yes, Block User'}
          </button>
        </div>
      </div>
    </div>
  );
};
