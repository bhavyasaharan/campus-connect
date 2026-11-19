import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import {
  createInstagramChallenge,
  resendInstagramChallenge,
  checkInstagramVerificationStatus,
  simulateDevInstagramDm,
  loginWithPasswordApi,
  requestLoginOtpApi,
  verifyLoginOtpApi
} from '../services/api';
import { UserProfile, InstagramChallenge, ChallengeLifecycleStatus } from '../types';

interface AuthViewProps {
  onLogin: (user: UserProfile, token: string) => void;
  onOpenAdminLogin?: () => void;
}

type AuthMode = 'LOGIN' | 'SIGN_IN';
type LoginMethod = 'PASSWORD' | 'OTP';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onOpenAdminLogin }) => {
  // Main Mode: 'LOGIN' (returning members) vs 'SIGN_IN' (Instagram verification onboarding)
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login Sub-method: 'PASSWORD' vs 'OTP'
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('PASSWORD');

  // ==========================================
  // 1. ID & Password Login State
  // ==========================================
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ==========================================
  // 2. OTP Login State
  // ==========================================
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [devGeneratedOtp, setDevGeneratedOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // ==========================================
  // 3. Instagram Sign In / Verification State
  // ==========================================
  const [step, setStep] = useState<'INPUT_HANDLE' | 'CHALLENGE_ACTIVE'>('INPUT_HANDLE');
  const [username, setUsername] = useState('');
  const [igLoading, setIgLoading] = useState(false);
  const [igErrorMessage, setIgErrorMessage] = useState<string | null>(null);

  // Challenge data
  const [challenge, setChallenge] = useState<InstagramChallenge | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeLifecycleStatus>('PENDING');
  const [failureReason, setFailureReason] = useState<string | null>(null);

  // Timers & Cooldown
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Dev mode helper for DM simulation
  const [showDevSimulator, setShowDevSimulator] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const pollingRef = useRef<any>(null);

  // Countdown timer for OTP login
  useEffect(() => {
    let timer: any = null;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCountdown]);

  // Countdown timer for Instagram challenge (5-min challenge expiry and 60s resend cooldown)
  useEffect(() => {
    let timer: any = null;
    if (step === 'CHALLENGE_ACTIVE' && authMode === 'SIGN_IN') {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setChallengeStatus('EXPIRED');
            return 0;
          }
          return prev - 1;
        });

        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, authMode]);

  // Polling verification status from backend for Instagram Sign-In
  useEffect(() => {
    if (
      authMode === 'SIGN_IN' &&
      step === 'CHALLENGE_ACTIVE' &&
      challenge &&
      (challengeStatus === 'PENDING' || challengeStatus === 'VERIFYING' || challengeStatus === 'CHECKING_ELIGIBILITY')
    ) {
      let consecutiveErrors = 0;
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkInstagramVerificationStatus(challenge.challengeId);
          consecutiveErrors = 0;
          setChallengeStatus(res.status);

          if (res.status === 'VERIFIED' && res.jwtToken && res.user) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            localStorage.setItem('campus_connect_jwt', res.jwtToken);
            setTimeout(() => {
              onLogin(res.user!, res.jwtToken!);
            }, 1200);
          } else if (res.status === 'FAILED' || res.status === 'EXPIRED' || res.status === 'MAX_ATTEMPTS_EXCEEDED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setFailureReason(res.failureReason || 'Verification check failed.');
          }
        } catch (err: any) {
          consecutiveErrors++;
          console.debug('Polling check status error:', err?.message);
          if (consecutiveErrors >= 6) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setFailureReason('Backend server unreachable. Please verify the server is running on port 8080.');
            setChallengeStatus('FAILED');
          }
        }
      }, 2500);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [step, authMode, challenge, challengeStatus, onLogin]);

  // ==========================================
  // Handlers for ID & Password Login
  // ==========================================
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your Username / Handle and Password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await loginWithPasswordApi(loginIdentifier.trim(), loginPassword.trim());
      localStorage.setItem('campus_connect_jwt', res.token);
      onLogin(res.user, res.token);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid login credentials.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // Handlers for OTP Login
  // ==========================================
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpIdentifier.trim()) {
      setOtpError('Please enter your Username, Handle, or Email to receive an OTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await requestLoginOtpApi(otpIdentifier.trim());
      setOtpSent(true);
      setOtpCountdown(res.expiresInSeconds || 300);
      if (res.otp) {
        setDevGeneratedOtp(res.otp);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP code.';
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIdentifier.trim() || !otpCode.trim()) {
      setOtpError('Please enter both your Username and the 6-digit OTP code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await verifyLoginOtpApi(otpIdentifier.trim(), otpCode.trim());
      localStorage.setItem('campus_connect_jwt', res.token);
      onLogin(res.user, res.token);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // ==========================================
  // Handlers for Instagram Sign In / Verification
  // ==========================================
  const handleStartInstagramSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    if (!cleanUsername) return;

    setIgLoading(true);
    setIgErrorMessage(null);

    try {
      const challengeData = await createInstagramChallenge(cleanUsername);
      setChallenge(challengeData);
      setChallengeStatus('PENDING');
      setRemainingSeconds(300);
      setCooldownSeconds(60);
      setStep('CHALLENGE_ACTIVE');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Instagram verification challenge.';
      setIgErrorMessage(msg);
    } finally {
      setIgLoading(false);
    }
  };

  const handleResendInstagram = async () => {
    if (!challenge || cooldownSeconds > 0) return;
    setIgLoading(true);
    setIgErrorMessage(null);
    try {
      const refreshed = await resendInstagramChallenge(challenge.challengeId);
      setChallenge(refreshed);
      setChallengeStatus('PENDING');
      setRemainingSeconds(300);
      setCooldownSeconds(60);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code.';
      setIgErrorMessage(msg);
    } finally {
      setIgLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (!challenge) return;
    navigator.clipboard.writeText(challenge.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleSimulateDevDm = async () => {
    if (!challenge) return;
    setSimulating(true);
    try {
      await simulateDevInstagramDm(challenge.claimedUsername, challenge.otp);
      setChallengeStatus('VERIFYING');
    } catch (err: any) {
      console.error('Simulation error', err);
      setIgErrorMessage('Simulation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSimulating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-3.5 sm:px-4 py-2 sm:py-8 relative overflow-x-hidden overflow-y-auto sm:overflow-hidden text-slate-100 overscroll-none">
      {/* Background ambient lighting wrapper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-pink-600/10 blur-[80px] sm:blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-indigo-600/10 blur-[80px] sm:blur-[130px]" />
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 backdrop-blur-2xl shadow-2xl relative z-10 my-auto">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-pink-500/20 mb-2 sm:mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Orbitly
          </h1>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: RETURNING USER LOGIN (ID & Password OR Login with OTP)           */}
        {/* ========================================================================= */}
        {authMode === 'LOGIN' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Sub-toggle: ID & Password vs OTP */}
            <div className="flex justify-center gap-1.5 sm:gap-2 p-1 bg-slate-950/50 rounded-xl border border-slate-800/60 mb-1.5 sm:mb-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('PASSWORD');
                  setLoginError(null);
                }}
                className={`flex-1 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === 'PASSWORD'
                    ? 'bg-slate-800 text-pink-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3" />
                ID & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('OTP');
                  setOtpError(null);
                }}
                className={`flex-1 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  loginMethod === 'OTP'
                    ? 'bg-slate-800 text-pink-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                Login using OTP
              </button>
            </div>

            {/* Option A: ID & Password */}
            {loginMethod === 'PASSWORD' && (
              <form onSubmit={handlePasswordLogin} className="space-y-2.5 sm:space-y-3.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5">
                    Username / Handle / Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. alex_orbit or sophia_chen"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-3.5 sm:pl-4 pr-10 sm:pr-11 py-2 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 sm:p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-2 text-xs text-red-300">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 sm:py-3.5 btn-theme-primary font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </form>
            )}

            {/* Option B: Login using OTP */}
            {loginMethod === 'OTP' && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5">
                    Username / Handle / Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      placeholder="e.g. alex_orbit or sophia_chen"
                      disabled={otpSent && otpCountdown > 0}
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all disabled:opacity-70"
                    />
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={otpLoading || (otpSent && otpCountdown > 240)}
                      className="px-3 sm:px-3.5 bg-slate-800 hover:bg-slate-700 text-pink-400 border border-pink-500/30 font-semibold text-xs rounded-xl transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Get OTP'
                      )}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <form onSubmit={handleVerifyOtp} className="space-y-3 sm:space-y-4 pt-1 animate-fadeIn">
                    <div>
                      <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                        <label className="text-[11px] sm:text-xs font-semibold text-slate-300">
                          Enter 6-Digit Login OTP
                        </label>
                        {otpCountdown > 0 && (
                          <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-pink-400" />
                            Expires in {formatSeconds(otpCountdown)}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.trim())}
                        placeholder="123456"
                        className="w-full tracking-widest text-center font-mono font-bold text-base sm:text-lg bg-slate-950/90 border border-pink-500/50 rounded-xl py-2 sm:py-3 text-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                      />
                    </div>

                    {devGeneratedOtp && (
                      <div className="p-2 sm:p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center justify-between text-[11px] sm:text-xs text-purple-200">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
                          <span>Dev OTP: <strong className="font-mono text-purple-300 tracking-wider">{devGeneratedOtp}</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpCode(devGeneratedOtp)}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={otpLoading || otpCode.length < 6}
                      className="w-full py-2.5 sm:py-3.5 btn-theme-primary font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {otpLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Verify OTP & Log In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {otpError && (
                  <div className="p-2.5 sm:p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-2 text-xs text-red-300">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom prompt to Switch to Sign In */}
            <div className="pt-2 sm:pt-3 border-t border-slate-800 text-center">
              <p className="text-[11px] sm:text-xs text-slate-400">
                New to Orbitly?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGN_IN');
                    setIgErrorMessage(null);
                  }}
                  className="font-semibold underline transition-colors"
                  style={{ color: 'var(--cc-accent)' }}
                >
                  Sign in with Instagram →
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SIGN IN / REGISTRATION (INSTAGRAM DM CHALLENGE)                   */}
        {/* ========================================================================= */}
        {authMode === 'SIGN_IN' && (
          <div>
            {step === 'INPUT_HANDLE' && (
              <form onSubmit={handleStartInstagramSignIn} className="space-y-3 sm:space-y-4">
                <div className="p-2.5 sm:p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold mb-0.5 sm:mb-1" style={{ color: 'var(--cc-accent)' }}>
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>First-Time Orbitly Sign In</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
                    Verify your Instagram handle once to create your profile and activate login access.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 sm:mb-1.5">
                    Your Instagram Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs sm:text-sm font-semibold">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_handle or username"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-7 sm:pl-8 pr-3.5 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                  </div>
                </div>

                {igErrorMessage && (
                  <div className="p-2.5 sm:p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-2 text-xs text-red-300">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{igErrorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={igLoading || !username.trim()}
                  className="w-full py-2.5 sm:py-3.5 btn-theme-primary font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {igLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Start Instagram Verification</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>

                <div className="pt-1.5 sm:pt-2 text-center">
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('LOGIN');
                        setLoginError(null);
                      }}
                      className="text-pink-400 hover:text-pink-300 font-semibold underline transition-colors"
                    >
                      Log in with ID or OTP →
                    </button>
                  </p>
                </div>
              </form>
            )}

            {step === 'CHALLENGE_ACTIVE' && challenge && (
              <div className="space-y-4 animate-fadeIn">
                {/* Status Indicator Banner */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      challengeStatus === 'VERIFIED' ? 'bg-green-500' :
                      challengeStatus === 'FAILED' || challengeStatus === 'EXPIRED' ? 'bg-red-500' :
                      'bg-pink-500 animate-ping'
                    }`} />
                    <span className="font-semibold text-slate-300">
                      {challengeStatus === 'PENDING' && 'Waiting for your Instagram DM...'}
                      {challengeStatus === 'VERIFYING' && 'Verifying OTP code...'}
                      {challengeStatus === 'CHECKING_ELIGIBILITY' && 'Auditing Instagram verification...'}
                      {challengeStatus === 'VERIFIED' && 'Verified! Logging you in...'}
                      {challengeStatus === 'EXPIRED' && 'Challenge expired.'}
                      {challengeStatus === 'FAILED' && 'Verification failed.'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-pink-400" />
                    <span>{formatSeconds(remainingSeconds)}</span>
                  </div>
                </div>

                {/* OTP Display Card */}
                <div className="p-4 bg-gradient-to-b from-slate-950/80 to-slate-900/80 border border-pink-500/30 rounded-2xl flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Your One-Time Code
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono tracking-widest text-pink-400">
                      {challenge.otp}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="Copy OTP"
                    >
                      {copiedOtp ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 text-center">
                    DM this 6-digit code from <strong>@{challenge.claimedUsername}</strong> to{' '}
                    <strong className="text-pink-300">@{challenge.communityAccount}</strong> on Instagram.
                  </span>
                </div>

                {/* Dev DM Simulator Accordion */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setShowDevSimulator(!showDevSimulator)}
                    className="w-full p-2.5 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="font-semibold flex items-center gap-1.5 text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      Sandbox / Dev DM Simulator
                    </span>
                    {showDevSimulator ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {showDevSimulator && (
                    <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2 text-xs">
                      <p className="text-[11px] text-slate-400">
                        Simulate the incoming Instagram webhook DM instantly without opening Meta app:
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateDevDm}
                        disabled={simulating || challengeStatus === 'VERIFIED'}
                        className="w-full py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {simulating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : challengeStatus === 'VERIFIED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-purple-300" />
                        )}
                        <span>{challengeStatus === 'VERIFIED' ? 'Verified Successfully' : 'Simulate Incoming DM Now'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {failureReason && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{failureReason}</span>
                  </div>
                )}

                {/* Resend & Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pollingRef.current) clearInterval(pollingRef.current);
                      setStep('INPUT_HANDLE');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Change Username
                  </button>

                  <button
                    type="button"
                    onClick={handleResendInstagram}
                    disabled={cooldownSeconds > 0 || igLoading}
                    className="text-xs font-semibold text-pink-400 hover:text-pink-300 disabled:text-slate-600 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${igLoading ? 'animate-spin' : ''}`} />
                    <span>{cooldownSeconds > 0 ? `Resend (${cooldownSeconds}s)` : 'Resend Code'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Staff / Admin Portal Entry */}
        {onOpenAdminLogin && (
          <div className="pt-2.5 sm:pt-4 mt-1.5 sm:mt-2 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 hover:text-purple-300 font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Staff & Administrator Access →</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
