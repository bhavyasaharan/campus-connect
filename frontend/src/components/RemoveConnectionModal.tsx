import React, { useState } from 'react';
import { UserMinus, X, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface RemoveConnectionModalProps {
  user: UserProfile | null;
  connectionId?: string;
  onClose: () => void;
  onConfirmRemove: (connectionId: string, user: UserProfile) => Promise<void> | void;
}

export const RemoveConnectionModal: React.FC<RemoveConnectionModalProps> = ({
  user,
  connectionId,
  onClose,
  onConfirmRemove,
}) => {
  const [removing, setRemoving] = useState(false);

  if (!user) return null;

  const handleConfirm = async () => {
    setRemoving(true);
    try {
      await onConfirmRemove(connectionId || '', user);
      onClose();
    } catch (err) {
      console.error('Failed to remove connection', err);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="rounded-3xl border border-[#34302C] max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        style={{ backgroundColor: '#121212' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={removing}
          className="absolute top-4 right-4 text-[#A9A198] hover:text-[#F5F1E8] p-1.5 rounded-xl hover:bg-[#211E1B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-[#C2526A]/20 text-[#C2526A] border border-[#C2526A]/30 flex-shrink-0">
            <UserMinus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#F5F1E8]">Unfollow Connection?</h3>
            <p className="text-xs text-[#A9A198]">
              {user.displayName} (@{user.handle})
            </p>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl text-xs space-y-2 mb-6 leading-relaxed border"
          style={{
            backgroundColor: 'var(--cc-surface)',
            borderColor: 'var(--cc-border)',
            color: 'var(--cc-text-secondary)',
          }}
        >
          <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--cc-text-primary)' }}>
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Unfollowing this connection will:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 opacity-80">
            <li>Disconnect you from each other on Orbitly</li>
            <li>Close your active private chat thread</li>
            <li>Remove this student from your Connections list</li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="flex-1 py-3 px-4 rounded-xl btn-theme-secondary text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={removing}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {removing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Unfollowing...</span>
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5" />
                <span>Unfollow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
