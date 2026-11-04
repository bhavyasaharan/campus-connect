import React, { useState } from 'react';
import { HeartHandshake, Check, X, Clock, MessageSquareQuote } from 'lucide-react';
import { ConnectRequest } from '../types';

interface RequestsViewProps {
  incomingRequests: ConnectRequest[];
  outgoingRequests: ConnectRequest[];
  onAccept: (request: ConnectRequest) => void;
  onDecline: (requestId: string) => void;
  onOpenChatWithUser: (userId: string) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  incomingRequests,
  outgoingRequests,
  onAccept,
  onDecline,
}) => {
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            Connection Requests <HeartHandshake className="w-5 h-5 text-pink-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Accept requests to unlock private one-on-one messaging.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setTab('incoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'incoming'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Received ({incomingRequests.length})
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'sent'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sent ({outgoingRequests.length})
          </button>
        </div>
      </div>

      {tab === 'incoming' ? (
        incomingRequests.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center mb-3 text-slate-500">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-200">No pending requests right now</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When classmates send you a connection request, you'll be able to review their profile and accept it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={req.fromUser.avatar}
                    alt={req.fromUser.displayName}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-pink-500/30 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{req.fromUser.displayName}</h4>
                      <span className="text-xs text-pink-400 font-semibold">@{req.fromUser.handle}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {req.fromUser.major} • {req.fromUser.year}
                    </p>

                    {req.note && (
                      <div className="mt-2 text-xs bg-slate-900/70 border border-slate-700/50 rounded-xl p-2.5 text-slate-200 flex items-start gap-1.5">
                        <MessageSquareQuote className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                        <span className="italic">"{req.note}"</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{req.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onDecline(req.id)}
                    className="p-2.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 border border-slate-600 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                    title="Decline request"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => onAccept(req)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept & Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center">
              <h4 className="text-base font-bold text-slate-200">No outgoing requests</h4>
              <p className="text-xs text-slate-400 mt-1">
                Explore students in Discovery and send connect requests.
              </p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.fromUser.avatar}
                    alt={req.fromUser.displayName}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-white">{req.fromUser.displayName}</h5>
                    <p className="text-xs text-slate-400">@{req.fromUser.handle}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Pending Acceptance
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
