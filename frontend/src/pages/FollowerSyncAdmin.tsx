import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserProfile, SyncStats } from '../types';

interface FollowerSyncAdminProps {
  users: UserProfile[];
  onSyncComplete: (verifiedHandles: Set<string>, stats: SyncStats) => void;
}

export const FollowerSyncAdmin: React.FC<FollowerSyncAdminProps> = ({ users, onSyncComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedHandles, setExtractedHandles] = useState<string[]>([]);
  const [, setSyncStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [stats, setStats] = useState<SyncStats | null>(null);

  // Parses typical Instagram export JSON formats:
  // format 1: array of objects [{ "string_list_data": [{ "value": "username" }] }]
  // format 2: array of strings ["username1", "username2"]
  // format 3: standard json list
  const parseFollowerJson = (jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent);
      const handles: string[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'string') {
            handles.push(item.toLowerCase().trim());
          } else if (item.string_list_data && Array.isArray(item.string_list_data)) {
            for (const sub of item.string_list_data) {
              if (sub.value) handles.push(sub.value.toLowerCase().trim());
            }
          } else if (item.value) {
            handles.push(item.value.toLowerCase().trim());
          }
        }
      } else if (data.relationships_followers && Array.isArray(data.relationships_followers)) {
        for (const item of data.relationships_followers) {
          if (item.string_list_data) {
            for (const sub of item.string_list_data) {
              if (sub.value) handles.push(sub.value.toLowerCase().trim());
            }
          }
        }
      }

      return Array.from(new Set(handles));
    } catch (err) {
      console.error('Invalid JSON', err);
      return null;
    }
  };

  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    setSyncStatus('processing');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const handles = parseFollowerJson(content);

      if (!handles || handles.length === 0) {
        alert('Could not find follower usernames in this JSON file. Please check the export format.');
        setSyncStatus('idle');
        return;
      }

      setExtractedHandles(handles);
      executeReconciliation(handles);
    };
    reader.readAsText(file);
  };

  const executeReconciliation = (handles: string[]) => {
    const handleSet = new Set(handles);
    let verified = 0;
    let grace = 0;
    let restricted = 0;

    users.forEach((u) => {
      const cleanHandle = u.handle.toLowerCase().trim();
      if (handleSet.has(cleanHandle)) {
        verified++;
      } else {
        if (u.status === 'GRACE_PERIOD') {
          grace++;
        } else {
          restricted++;
        }
      }
    });

    const newStats: SyncStats = {
      importedCount: handles.length,
      verifiedCount: verified,
      graceCount: grace,
      restrictedCount: restricted,
      lastSyncTime: new Date().toLocaleTimeString(),
    };

    setStats(newStats);
    setSyncStatus('done');
    onSyncComplete(handleSet, newStats);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Campus Handle & Follower Ingestion <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400">
            Reconcile campus app users against the designated social account followers export.
          </p>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleProcessFile(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
        }`}
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <input
          id="file-upload-input"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleProcessFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {fileName ? `Loaded: ${fileName}` : 'Drag & Drop your followers JSON file here'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          Drop your exported <code className="text-pink-400 font-mono">followers_1.json</code> or click to browse. The background scheduler reconciles all campus handles instantly.
        </p>

        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Supports Instagram JSON export format
        </span>
      </div>

      {/* Sync Metric Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Imported Handles
            </span>
            <div className="text-2xl font-black text-indigo-400">{stats.importedCount}</div>
            <span className="text-[10px] text-slate-500">From export file</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Verified Users
            </span>
            <div className="text-2xl font-black text-emerald-400">{stats.verifiedCount}</div>
            <span className="text-[10px] text-emerald-500/80">Full access granted</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Grace Period
            </span>
            <div className="text-2xl font-black text-amber-400">{stats.graceCount}</div>
            <span className="text-[10px] text-amber-500/80">Pending sync window</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Restricted
            </span>
            <div className="text-2xl font-black text-rose-400">{stats.restrictedCount}</div>
            <span className="text-[10px] text-rose-500/80">Not in follower list</span>
          </div>
        </div>
      )}

      {/* Reconciled Users Audit Table */}
      <div className="mt-8 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">Registered Campus Accounts Audit</h4>
          <span className="text-xs text-slate-400">{users.length} registered students</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {users.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No registered students found.
            </div>
          ) : (
            users.map((u) => {
              const isFollower = extractedHandles.includes(u.handle.toLowerCase());
              return (
                <div key={u.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.displayName} className="w-9 h-9 rounded-xl object-cover" />
                    <div>
                      <h5 className="text-sm font-bold text-white">{u.displayName}</h5>
                      <p className="text-xs text-pink-400">@{u.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFollower || u.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Follower Verified
                      </span>
                    ) : u.status === 'GRACE_PERIOD' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Grace Period (24h)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Missing from Followers
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
