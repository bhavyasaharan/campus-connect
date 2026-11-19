import React, { useState } from 'react';
import { Flag, X, CheckCircle } from 'lucide-react';
import { UserProfile, ReportReason } from '../types';

interface ReportModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onSubmitReport: (reportedUser: UserProfile, reason: ReportReason, details?: string) => Promise<void> | void;
}

const REPORT_REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'HARASSMENT', label: 'Harassment & Bullying', desc: 'Disrespectful, threatening, or unwanted persistent conduct' },
  { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', desc: 'Offensive language, explicit imagery, or misconduct' },
  { key: 'IMPERSONATION', label: 'Impersonation or Fake Account', desc: 'Pretending to be another campus student or faculty' },
  { key: 'SPAM', label: 'Spam or Commercial Promotion', desc: 'Unsolicited advertising, bots, or scam links' },
  { key: 'OTHER', label: 'Other Campus Policy Violation', desc: 'Any other safety or code of conduct violation' },
];

export const ReportModal: React.FC<ReportModalProps> = ({ user, onClose, onSubmitReport }) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('HARASSMENT');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitReport(user, selectedReason, details.trim());
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Report submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Thank you for keeping Orbitly safe. Our safety team reviews all reports promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Report User</h3>
                <p className="text-xs text-slate-400">
                  Reporting <strong className="text-pink-400">@{user.handle}</strong> ({user.displayName})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Select Reason <span className="text-rose-400">*</span>
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => {
                  const isSelected = selectedReason === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => setSelectedReason(r.key)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-pink-950/40 border-pink-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Additional Context (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred or any relevant message context..."
                rows={3}
                maxLength={300}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <div className="text-right text-[10px] text-slate-500">{details.length}/300</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl btn-theme-primary disabled:opacity-50 text-xs font-bold transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
