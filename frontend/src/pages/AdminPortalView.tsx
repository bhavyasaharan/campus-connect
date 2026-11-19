import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Search,
  UserX,
  UserCheck,
  LogOut,
  ArrowLeft,
  Clock,
  History,
  Activity,
  LogIn,
  MessageSquare,
  X,
  Check,
} from 'lucide-react';
import {
  AdminUser,
  AdminUserManagement,
  FollowerSyncLog,
  SyncStats,
  AuthSessionLog,
  AdminReport,
} from '../types';
import {
  uploadFollowersFileApi,
  fetchAdminUsersApi,
  suspendUserApi,
  activateUserApi,
  fetchFollowerSyncLogsApi,
  fetchAuthSessionLogsApi,
  fetchAdminReportsApi,
  resolveAdminReportApi,
} from '../services/api';

interface AdminPortalViewProps {
  admin: AdminUser | null;
  onExit: () => void;
  onLogout: () => void;
}

type AdminTab = 'STUDENTS' | 'REPORTS' | 'SYNC' | 'LOGS';

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  admin,
  onExit,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('STUDENTS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStats, setLastSyncStats] = useState<SyncStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<FollowerSyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Auth & Session activity logs state
  const [authLogs, setAuthLogs] = useState<AuthSessionLog[]>([]);
  const [loadingAuthLogs, setLoadingAuthLogs] = useState(false);
  const [authLogFilter, setAuthLogFilter] = useState<'ALL' | 'LOGIN' | 'LOGOUT' | 'STUDENT' | 'ADMIN'>('ALL');
  const [authLogSearch, setAuthLogSearch] = useState('');

  // Reports & Safety Moderation state
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [reportActionLoadingId, setReportActionLoadingId] = useState<number | null>(null);

  // Review modal state
  const [activeReportModal, setActiveReportModal] = useState<AdminReport | null>(null);
  const [modalAction, setModalAction] = useState<'SUSPEND_USER' | 'RESOLVE_NO_ACTION' | 'DISMISSED'>('RESOLVE_NO_ACTION');
  const [modalNotes, setModalNotes] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Students moderation state
  const [students, setStudents] = useState<AdminUserManagement[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED' | 'RESTRICTED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load students & logs & reports
  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await fetchAdminUsersApi();
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to load students', err);
      showToast('Error loading student accounts.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await fetchAdminReportsApi();
      setReports(data);
    } catch (err: any) {
      console.debug('Failed to load reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadSyncLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchFollowerSyncLogsApi();
      setSyncLogs(data);
    } catch (err: any) {
      console.debug('Failed to load sync logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAuthLogs = async () => {
    setLoadingAuthLogs(true);
    try {
      const data = await fetchAuthSessionLogsApi();
      setAuthLogs(data);
    } catch (err: any) {
      console.debug('Failed to load auth logs', err);
    } finally {
      setLoadingAuthLogs(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadReports();
    loadSyncLogs();
    loadAuthLogs();
  }, []);

  const handleResolveReport = async (
    report: AdminReport,
    action: 'SUSPEND_USER' | 'RESOLVE_NO_ACTION' | 'DISMISSED',
    notes?: string
  ) => {
    setReportActionLoadingId(report.id);
    setModalSubmitting(true);
    try {
      const updated = await resolveAdminReportApi(report.id, {
        action,
        suspendReportedUser: action === 'SUSPEND_USER',
        reviewerNotes: notes,
      });

      setReports((prev) => prev.map((r) => (r.id === report.id ? updated : r)));
      if (action === 'SUSPEND_USER') {
        loadStudents();
      }

      const actionMsg =
        action === 'SUSPEND_USER'
          ? `Report #${report.id} resolved: @${report.reportedUserHandle} has been suspended.`
          : action === 'DISMISSED'
          ? `Report #${report.id} dismissed.`
          : `Report #${report.id} marked as resolved.`;
      showToast(actionMsg);
      setActiveReportModal(null);
      setModalNotes('');
    } catch (err: any) {
      console.error('Failed to resolve report', err);
      showToast(err.response?.data?.message || err.message || 'Failed to process report action.');
    } finally {
      setReportActionLoadingId(null);
      setModalSubmitting(false);
    }
  };

  // Handle file upload and reconciliation
  const handleUploadAndSync = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) {
      showToast('Please select an Instagram export JSON file first.');
      return;
    }

    setIsSyncing(true);
    try {
      const stats = await uploadFollowersFileApi(file);
      setLastSyncStats(stats);
      showToast(`Follower sync complete: ${stats.verifiedCount} verified out of ${stats.importedCount} handles!`);
      setSelectedFile(null);
      // Refresh audit logs and students list
      loadSyncLogs();
      loadStudents();
    } catch (err: any) {
      console.error('Follower sync error', err);
      showToast(err.response?.data?.message || err.message || 'Follower sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Student suspension toggle
  const handleToggleSuspend = async (student: AdminUserManagement) => {
    const isSuspending = student.accountStatus === 'ACTIVE';
    const actionText = isSuspending ? 'suspend' : 'reactivate';

    if (!window.confirm(`Are you sure you want to ${actionText} @${student.handle}'s account?`)) {
      return;
    }

    setActionLoadingId(student.id);
    try {
      if (isSuspending) {
        await suspendUserApi(student.id);
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, accountStatus: 'SUSPENDED' } : s))
        );
        showToast(`Account @${student.handle} suspended successfully.`);
      } else {
        await activateUserApi(student.id);
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, accountStatus: 'ACTIVE' } : s))
        );
        showToast(`Account @${student.handle} reactivated successfully.`);
      }
    } catch (err: any) {
      console.error(`Failed to ${actionText} student`, err);
      showToast(err.response?.data?.message || `Failed to ${actionText} student.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.handle.toLowerCase().includes(q) ||
      s.displayName.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.college && s.college.toLowerCase().includes(q)) ||
      (s.course && s.course.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return s.accountStatus === 'ACTIVE';
    if (statusFilter === 'SUSPENDED') return s.accountStatus === 'SUSPENDED';
    if (statusFilter === 'VERIFIED') return s.verificationStatus === 'VERIFIED';
    if (statusFilter === 'RESTRICTED') return s.verificationStatus === 'RESTRICTED';

    return true;
  });

  const totalActive = students.filter((s) => s.accountStatus === 'ACTIVE').length;
  const totalSuspended = students.filter((s) => s.accountStatus === 'SUSPENDED').length;
  const totalVerified = students.filter((s) => s.verificationStatus === 'VERIFIED').length;

  const filteredAuthLogs = authLogs.filter((log) => {
    const q = authLogSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.identifier.toLowerCase().includes(q) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
      (log.userAgent && log.userAgent.toLowerCase().includes(q)) ||
      (log.loginMethod && log.loginMethod.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (authLogFilter === 'LOGIN') return log.activityType === 'LOGIN';
    if (authLogFilter === 'LOGOUT') return log.activityType === 'LOGOUT';
    if (authLogFilter === 'STUDENT') return log.userType === 'STUDENT';
    if (authLogFilter === 'ADMIN') return log.userType === 'ADMIN';

    return true;
  });

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    const q = reportSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rep.reporterHandle.toLowerCase().includes(q) ||
      rep.reporterDisplayName.toLowerCase().includes(q) ||
      rep.reportedUserHandle.toLowerCase().includes(q) ||
      rep.reportedUserDisplayName.toLowerCase().includes(q) ||
      rep.reason.toLowerCase().includes(q) ||
      (rep.details && rep.details.toLowerCase().includes(q)) ||
      (rep.reviewerNotes && rep.reviewerNotes.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (reportFilter === 'PENDING') return rep.status === 'PENDING';
    if (reportFilter === 'RESOLVED') return rep.status === 'RESOLVED';
    if (reportFilter === 'DISMISSED') return rep.status === 'DISMISSED';

    return true;
  });

  const totalReportsCount = reports.length;
  const pendingReportsCount = reports.filter((r) => r.status === 'PENDING').length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const dismissedReportsCount = reports.filter((r) => r.status === 'DISMISSED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 border border-purple-500 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-purple-900/40 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">Orbitly Admin</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {admin?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">@{admin?.username || 'campus_admin'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Switch back to student application view"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student View</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Admin Tab Switcher */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'STUDENTS'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'REPORTS'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Reports</span>
            {pendingReportsCount > 0 ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold animate-pulse">
                {pendingReportsCount}
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {reports.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SYNC')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SYNC'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Logs</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {authLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4">
        {/* ========================================================================= */}
        {/* TAB 1: STUDENT MODERATION & ACCOUNT CONTROLS                              */}
        {/* ========================================================================= */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Students
                </span>
                <div className="text-2xl font-black text-white">{students.length}</div>
                <span className="text-[10px] text-slate-500">Registered campus accounts</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Accounts
                </span>
                <div className="text-2xl font-black text-emerald-400">{totalActive}</div>
                <span className="text-[10px] text-emerald-500/80">In good standing</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Insta Verified
                </span>
                <div className="text-2xl font-black text-indigo-400">{totalVerified}</div>
                <span className="text-[10px] text-indigo-400/80">Confirmed Instagram verified</span>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Suspended
                </span>
                <div className="text-2xl font-black text-rose-400">{totalSuspended}</div>
                <span className="text-[10px] text-rose-500/80">Policy enforcement</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, @handle, email, college or course..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SUSPENDED">Suspended Only</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="RESTRICTED">Restricted Only</option>
                </select>

                <button
                  type="button"
                  onClick={loadStudents}
                  disabled={loadingStudents}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center"
                  title="Refresh students list"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStudents ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Student Profile</th>
                      <th className="py-3.5 px-4">Campus & Course</th>
                      <th className="py-3.5 px-4">Verification Status</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          {loadingStudents ? 'Loading student records...' : 'No campus students match the query.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSuspended = s.accountStatus === 'SUSPENDED';
                        const isLoading = actionLoadingId === s.id;

                        return (
                          <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Profile Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-white uppercase text-xs">
                                  {s.displayName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">{s.displayName}</div>
                                  <div className="text-[11px] text-pink-400 font-mono">@{s.handle}</div>
                                  {s.email && <div className="text-[10px] text-slate-500">{s.email}</div>}
                                </div>
                              </div>
                            </td>

                            {/* Campus / Course */}
                            <td className="py-3 px-4">
                              <div className="text-slate-200 font-medium">{s.course || 'General Studies'}</div>
                              <div className="text-[10px] text-slate-400">{s.college || 'Campus University'}</div>
                            </td>

                            {/* Verification Status */}
                            <td className="py-3 px-4">
                              {s.verificationStatus === 'VERIFIED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Insta Verified
                                </span>
                              ) : s.verificationStatus === 'GRACE_PERIOD' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3" />
                                  Grace Period
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  Restricted
                                </span>
                              )}
                            </td>

                            {/* Account Status */}
                            <td className="py-3 px-4">
                              {isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/50">
                                  <UserX className="w-3 h-3 text-rose-400" />
                                  SUSPENDED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            {/* Joined Date */}
                            <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            {/* Action Button */}
                            <td className="py-3 px-4 text-right">
                              {isSuspended ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(s)}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3 h-3" />
                                  )}
                                  <span>Reactivate</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspend(s)}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserX className="w-3 h-3" />
                                  )}
                                  <span>Suspend</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER REPORTS & SAFETY MODERATION                                  */}
        {/* ========================================================================= */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Student Violation Reports & Campus Moderation</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Review student-submitted policy violation reports, inspect harassment or inappropriate conduct, and apply enforcement actions (account suspensions, formal warnings, or dismissal).
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] text-slate-400 font-medium">Total Reports</div>
                <div className="text-xl font-black text-white mt-1">{totalReportsCount}</div>
              </div>
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Pending Review
                </div>
                <div className="text-xl font-black text-amber-300 mt-1">{pendingReportsCount}</div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-emerald-400 font-medium">Resolved</div>
                <div className="text-xl font-black text-emerald-300 mt-1">{resolvedReportsCount}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] text-slate-400 font-medium">Dismissed</div>
                <div className="text-xl font-black text-slate-300 mt-1">{dismissedReportsCount}</div>
              </div>
            </div>

            {/* Filter and Search controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Search reports by reported user, reporter handle, violation reason, details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setReportFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      reportFilter === filter
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={loadReports}
                  disabled={loadingReports}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center shrink-0"
                  title="Refresh reports"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Reports Matching Filter</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {loadingReports
                      ? 'Fetching campus moderation reports...'
                      : 'All student violation reports have been addressed or none match your current search criteria.'}
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isPending = report.status === 'PENDING';
                  const isResolved = report.status === 'RESOLVED';
                  const isDismissed = report.status === 'DISMISSED';
                  const isSuspended = report.reportedUserAccountStatus === 'SUSPENDED';
                  const isActionLoading = reportActionLoadingId === report.id;

                  return (
                    <div
                      key={report.id}
                      className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all ${
                        isPending
                          ? 'border-amber-500/40 hover:border-amber-500/60'
                          : isResolved
                          ? 'border-slate-800 hover:border-slate-700'
                          : 'border-slate-800/80 opacity-80'
                      }`}
                    >
                      {/* Card Top Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-purple-400">
                            Report #{report.id}
                          </span>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              PENDING REVIEW
                            </span>
                          )}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              RESOLVED
                            </span>
                          )}
                          {isDismissed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              <X className="w-3 h-3" />
                              DISMISSED
                            </span>
                          )}

                          {/* Violation Category Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              report.reason === 'HARASSMENT'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : report.reason === 'INAPPROPRIATE_CONTENT'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : report.reason === 'SPAM'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {report.reason.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Filed: {new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Card Content Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        {/* Reported User Box */}
                        <div className="bg-slate-950/70 border border-rose-500/20 rounded-xl p-3.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center justify-between">
                            <span>Reported Student</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isSuspended
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              Account: {report.reportedUserAccountStatus || 'ACTIVE'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {report.reportedUserAvatarUrl ? (
                              <img
                                src={report.reportedUserAvatarUrl}
                                alt={report.reportedUserHandle}
                                className="w-10 h-10 rounded-xl object-cover border border-rose-500/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-300 uppercase text-xs">
                                {report.reportedUserDisplayName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white text-xs">
                                {report.reportedUserDisplayName}
                              </div>
                              <div className="text-xs text-rose-400 font-mono">
                                @{report.reportedUserHandle}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                User ID: #{report.reportedUserId}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Reporting Student Box */}
                        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Reported By
                          </div>
                          <div className="flex items-center gap-3">
                            {report.reporterAvatarUrl ? (
                              <img
                                src={report.reporterAvatarUrl}
                                alt={report.reporterHandle}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-800"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 uppercase text-xs">
                                {report.reporterDisplayName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-200 text-xs">
                                {report.reporterDisplayName}
                              </div>
                              <div className="text-xs text-purple-400 font-mono">
                                @{report.reporterHandle}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                User ID: #{report.reporterId}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Report Details Context */}
                      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                          <span>Student Explanation & Details</span>
                        </div>
                        <p className="italic text-slate-300 leading-relaxed">
                          "{report.details || 'No additional explanation provided by the reporter.'}"
                        </p>
                      </div>

                      {/* Resolution Details (if previously resolved or dismissed) */}
                      {!isPending && (
                        <div className="mt-3 bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Action Enacted:</span>
                              <span className="font-mono font-bold text-purple-300">
                                {report.actionTaken || 'RESOLVED'}
                              </span>
                            </div>
                            {report.resolvedAt && (
                              <span className="text-slate-500 font-mono text-[10px]">
                                Resolved on: {new Date(report.resolvedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {report.reviewerNotes && (
                            <div className="mt-2 text-slate-300 border-t border-purple-500/20 pt-2 text-[11px]">
                              <strong className="text-purple-300">Moderator Note:</strong>{' '}
                              {report.reviewerNotes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Moderator Action Bar */}
                      <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500">
                          {isPending
                            ? 'Action required: Decide enforcement action for this violation.'
                            : 'This report has been reviewed and recorded in the audit log.'}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReportModal(report);
                              setModalAction('SUSPEND_USER');
                              setModalNotes('');
                            }}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspend & Resolve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveReportModal(report);
                              setModalAction('RESOLVE_NO_ACTION');
                              setModalNotes('');
                            }}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Resolve (No Ban)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveReportModal(report);
                              setModalAction('DISMISSED');
                              setModalNotes('');
                            }}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INSTAGRAM FOLLOWER RECONCILIATION                                 */}
        {/* ========================================================================= */}
        {activeTab === 'SYNC' && (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Instagram Follower Ingestion & Verification</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Upload an official Instagram export file (e.g., <code className="text-purple-300 font-mono">followers_1.json</code>) to automatically audit and reconcile registered students. Students who follow your campus account will maintain full verified status.
                </p>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
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
                  const file = e.dataTransfer.files[0];
                  setSelectedFile(file);
                  handleUploadAndSync(file);
                }
              }}
              onClick={() => document.getElementById('admin-file-upload')?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-400 bg-purple-500/10'
                  : 'border-slate-700 bg-slate-900/60 hover:border-purple-500/60 hover:bg-slate-900'
              }`}
            >
              <input
                id="admin-file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setSelectedFile(file);
                    handleUploadAndSync(file);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                {isSyncing ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              <h4 className="text-base font-bold text-white mb-1">
                {isSyncing
                  ? 'Reconciling followers with campus database...'
                  : selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : 'Drop your Instagram Followers export JSON here'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Supports official Instagram export format. The server processes all follower handles and updates verified student statuses in real-time.
              </p>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload <code className="text-purple-300 font-mono">followers_1.json</code></span>
              </span>
            </div>

            {/* Last Sync Results Card */}
            {lastSyncStats && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Latest Reconciliation Results
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Synced at {lastSyncStats.lastSyncTime}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Imported Handles</span>
                    <span className="text-xl font-black text-purple-400">{lastSyncStats.importedCount}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Followers Verified</span>
                    <span className="text-xl font-black text-emerald-400">{lastSyncStats.verifiedCount}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Grace Period</span>
                    <span className="text-xl font-black text-amber-400">{lastSyncStats.graceCount}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Restricted</span>
                    <span className="text-xl font-black text-rose-400">{lastSyncStats.restrictedCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reconciliation Audit Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Reconciliation Audit Log History</h4>
                </div>
                <button
                  type="button"
                  onClick={loadSyncLogs}
                  disabled={loadingLogs}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Batch ID</th>
                      <th className="py-3 px-4">Source File</th>
                      <th className="py-3 px-4">Handles Imported</th>
                      <th className="py-3 px-4">Verified</th>
                      <th className="py-3 px-4">Restricted</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {syncLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {loadingLogs ? 'Loading audit history...' : 'No previous follower reconciliation batches recorded.'}
                        </td>
                      </tr>
                    ) : (
                      syncLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono text-purple-300 text-[11px]">{log.batchId}</td>
                          <td className="py-2.5 px-4 text-slate-300 font-medium">{log.fileName}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-200">{log.totalImported}</td>
                          <td className="py-2.5 px-4 text-emerald-400 font-bold">{log.verifiedCount}</td>
                          <td className="py-2.5 px-4 text-rose-400 font-bold">{log.restrictedCount}</td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(log.syncedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUTHENTICATION & SESSION ACTIVITY LOGS (LOGIN / LOGOUT AUDIT)     */}
        {/* ========================================================================= */}
        {activeTab === 'LOGS' && (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl flex items-start gap-3">
              <Activity className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Login & Logout Activity Audit Trail</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Real-time security logs capturing authentication and sign-out events for both campus students and administrators, including timestamp, login method, IP address, and client details.
                </p>
              </div>
            </div>

            {/* Filter and Search controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={authLogSearch}
                  onChange={(e) => setAuthLogSearch(e.target.value)}
                  placeholder="Filter logs by username, handle, IP address, or login method..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={authLogFilter}
                  onChange={(e) => setAuthLogFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Events</option>
                  <option value="LOGIN">Logins Only</option>
                  <option value="LOGOUT">Logouts Only</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="ADMIN">Admins Only</option>
                </select>

                <button
                  type="button"
                  onClick={loadAuthLogs}
                  disabled={loadingAuthLogs}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center"
                  title="Refresh activity logs"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAuthLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Session Logs Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Event Time</th>
                      <th className="py-3 px-4">Account Type</th>
                      <th className="py-3 px-4">User Identifier</th>
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">IP & Client Details</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAuthLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          {loadingAuthLogs ? 'Loading activity logs...' : 'No authentication logs recorded matching the criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAuthLogs.map((log) => {
                        const isLogin = log.activityType === 'LOGIN';
                        const isAdmin = log.userType === 'ADMIN';

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>

                            <td className="py-3 px-4">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <ShieldCheck className="w-3 h-3" />
                                  ADMIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  <Users className="w-3 h-3" />
                                  STUDENT
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-200">
                                @{log.identifier}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1.5">(ID #{log.userId})</span>
                            </td>

                            <td className="py-3 px-4">
                              {isLogin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <LogIn className="w-3 h-3" />
                                  LOGIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <LogOut className="w-3 h-3" />
                                  LOGOUT
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {log.loginMethod || '—'}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-mono text-[11px] text-slate-300">
                                {log.ipAddress || 'unknown'}
                              </div>
                              {log.userAgent && (
                                <div className="text-[10px] text-slate-500 truncate max-w-xs" title={log.userAgent}>
                                  {log.userAgent}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Report Review & Moderation Modal */}
      {activeReportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!modalSubmitting) {
              setActiveReportModal(null);
            }
          }}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Enforce Moderation Action</h3>
                    <p className="text-xs text-purple-300 font-mono">
                      Report #{activeReportModal.id} • {activeReportModal.reason.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                disabled={modalSubmitting}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Context Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>
                  Reported: <strong className="text-rose-400 font-mono">@{activeReportModal.reportedUserHandle}</strong>
                </span>
                <span>
                  Filed by: <strong className="text-purple-300 font-mono">@{activeReportModal.reporterHandle}</strong>
                </span>
              </div>
              {activeReportModal.details && (
                <div className="text-slate-300 italic bg-slate-900/80 rounded-xl p-2.5 text-[11px] border border-slate-800">
                  "{activeReportModal.details}"
                </div>
              )}
            </div>

            {/* Moderation Action Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Choose Action
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setModalAction('SUSPEND_USER')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    modalAction === 'SUSPEND_USER'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-white">Suspend Student & Resolve Report</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Immediately revokes student access and marks this safety report as resolved.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalAction('RESOLVE_NO_ACTION')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    modalAction === 'RESOLVE_NO_ACTION'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-white">Resolve Report (No Suspension)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Mark as investigated/resolved without barring student access (e.g. issued verbal warning).
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalAction('DISMISSED')}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    modalAction === 'DISMISSED'
                      ? 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <X className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-white">Dismiss Report</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Reject this report as unfounded, insufficient evidence, or false alarm.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reviewer Notes Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Administrative Notes (Optional)
              </label>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                rows={3}
                placeholder="Document your findings or rationale (e.g., reviewed message thread, policy violation confirmed)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                disabled={modalSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveReport(activeReportModal, modalAction, modalNotes)}
                disabled={modalSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-lg ${
                  modalAction === 'SUSPEND_USER'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : modalAction === 'DISMISSED'
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {modalSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Action</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
