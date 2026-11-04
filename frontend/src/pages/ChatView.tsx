import React, { useState } from 'react';
import { Send, Lock, ShieldCheck, CheckCheck } from 'lucide-react';
import { Connection, ChatMessage, UserProfile } from '../types';

interface ChatViewProps {
  connections: Connection[];
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string) => void;
  messages: Record<string, ChatMessage[]>;
  onSendMessage: (connectionId: string, content: string) => void;
  currentUser: UserProfile;
}

export const ChatView: React.FC<ChatViewProps> = ({
  connections,
  activeConnectionId,
  setActiveConnectionId,
  messages,
  onSendMessage,
  currentUser,
}) => {
  const [inputText, setInputText] = useState('');

  const activeConn = connections.find((c) => c.id === activeConnectionId) || connections[0];
  const activeMessages = activeConn ? messages[activeConn.id] || [] : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConn) return;
    onSendMessage(activeConn.id, inputText.trim());
    setInputText('');
  };

  if (connections.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center mb-4 text-pink-400">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Connections Yet</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Private messaging is locked until you send or accept a Connection Request with a classmate.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 h-[calc(100vh-5rem)] flex gap-4">
      {/* Sidebar Connections List */}
      <div className="w-80 flex-shrink-0 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-extrabold text-white text-base">Connections ({connections.length})</h3>
          <p className="text-[11px] text-slate-400">Mutual accepted connections</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {connections.map((conn) => {
            const isSelected = activeConn?.id === conn.id;
            return (
              <button
                key={conn.id}
                onClick={() => setActiveConnectionId(conn.id)}
                className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
                  isSelected ? 'bg-slate-800/90 border-l-4 border-pink-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="relative">
                  <img
                    src={conn.user.avatar}
                    alt={conn.user.displayName}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  {conn.user.status === 'VERIFIED' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{conn.user.displayName}</h4>
                    <span className="text-[10px] text-slate-500">{conn.lastMessageTime || 'New'}</span>
                  </div>
                  <p className="text-xs text-pink-400 truncate">@{conn.user.handle}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{conn.lastMessage || 'Connected!'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Window */}
      {activeConn ? (
        <div className="flex-1 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 px-5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeConn.user.avatar}
                alt={activeConn.user.displayName}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
              />
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {activeConn.user.displayName}
                  <span className="text-[11px] font-normal text-pink-300">(@{activeConn.user.handle})</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeConn.user.major} • {activeConn.user.year}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chat Unlocked</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-center my-2">
              <span className="text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                🔒 You both connected. Direct messages are private.
              </span>
            </div>

            {activeMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 px-1">
                    <span>{msg.sentAt}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-pink-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeConn.user.displayName}...`}
              className="flex-1 bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          Select a connection to start chatting
        </div>
      )}
    </div>
  );
};
