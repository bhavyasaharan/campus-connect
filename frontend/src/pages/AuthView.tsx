import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  createInstagramChallenge,
  resendInstagramChallenge,
  checkInstagramVerificationStatus,
  simulateDevInstagramDm
} from '../services/api';
import { UserProfile, InstagramChallenge, ChallengeLifecycleStatus } from '../types';

interface AuthViewProps {
  onLogin: (user: UserProfile, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  // Step State: 'INPUT_HANDLE' | 'CHALLENGE_ACTIVE'
  const [step, setStep] = useState<'INPUT_HANDLE' | 'CHALLENGE_ACTIVE'>('INPUT_HANDLE');

  // Input
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Challenge data
  const [challenge, setChallenge] = useState<InstagramChallenge | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeLifecycleStatus>('PENDING');
  const [failureReason, setFailureReason] = useState<string | null>(null);

  // Timers & Cooldown
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Dev mode helper
  const [showDevSimulator, setShowDevSimulator] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const pollingRef = useRef<any>(null);

  // Countdown timer for 5-min challenge expiry and 60s resend cooldown
  useEffect(() => {
    let timer: any = null;
    if (step === 'CHALLENGE_ACTIVE') {
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
  }, [step]);

  // Polling verification status from backend
  useEffect(() => {
    if (step === 'CHALLENGE_ACTIVE' && challenge && (challengeStatus === 'PENDING' || challengeStatus === 'VERIFYING' || challengeStatus === 'CHECKING_ELIGIBILITY')) {
      let consecutiveErrors = 0;
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkInstagramVerificationStatus(challenge.challengeId);
          consecutiveErrors = 0;
          setChallengeStatus(res.status);

          if (res.status === 'VERIFIED' && res.jwtToken && res.user) {
            // Stop polling immediately
            if (pollingRef.current) clearInterval(pollingRef.current);
            // Save token and trigger login
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
  }, [step, challenge, challengeStatus, onLogin]);

  // Handle Form Submit: Create Challenge
  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.replace('@', '').toLowerCase().trim();
    if (!cleanUsername) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const challengeData = await createInstagramChallenge(cleanUsername);
      setChallenge(challengeData);
      setChallengeStatus('PENDING');
      setRemainingSeconds(300);
      setCooldownSeconds(60);
      setStep('CHALLENGE_ACTIVE');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Instagram verification challenge.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (!challenge || cooldownSeconds > 0) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const refreshed = await resendInstagramChallenge(challenge.challengeId);
      setChallenge(refreshed);
      setChallengeStatus('PENDING');
      setRemainingSeconds(300);
      setCooldownSeconds(60);
      setFailureReason(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Could not resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Copy OTP helper
  const handleCopyOtp = () => {
    if (!challenge) return;
    navigator.clipboard.writeText(challenge.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Safe Dev Mode Simulation helper
  const handleSimulateDevDm = async () => {
    if (!challenge) return;
    setSimulating(true);
    try {
      await simulateDevInstagramDm(challenge.claimedUsername, challenge.otp);
    } catch (err: any) {
      console.error('Simulation error', err);
    } finally {
      setSimulating(false);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-6 z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-pink-500/25 mx-auto mb-3">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
          CampusConnect
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Exclusive college community gated by official Instagram follow verification.
        </p>
      </div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md z-10">
        {step === 'INPUT_HANDLE' ? (
          <div>
            {/* Value Proposition & Follower Requirement Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-pink-500/30 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex-shrink-0 shadow-md">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Follower-Gated Community</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Only verified followers of our official Instagram page can access CampusConnect. You will verify your account by sending a secure one-time code to our Instagram DM.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartVerification} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Enter Your Instagram Handle <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base text-pink-400 font-semibold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_insta_username"
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Used for both initial registration and return login.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Challenge...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Instagram</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero Password Architecture
              </span>
              <span>Single-use OTP verification</span>
            </div>
          </div>
        ) : (
          /* STEP: CHALLENGE ACTIVE */
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400">
                Verifying <strong className="text-white">@{challenge?.claimedUsername}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep('INPUT_HANDLE');
                  setChallenge(null);
                  setFailureReason(null);
                }}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
              >
                Change Handle
              </button>
            </div>

            {/* OTP Code Display Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 text-center mb-5 relative overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your 6-Digit DM Verification Code
              </span>

              <div className="flex items-center justify-center gap-3 my-2">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-300 select-all">
                  {challenge?.otp}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copy Code"
                >
                  {copiedOtp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Code expires in: <strong>{formatTime(remainingSeconds)}</strong></span>
              </div>
            </div>

            {/* Instructions & Direct Instagram Link */}
            <div className="space-y-3 mb-5">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>How to complete verification:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>Open Instagram and search for <strong>@{challenge?.communityAccount}</strong></li>
                  <li>Ensure your account follows our page</li>
                  <li>Send the 6-digit code <strong className="font-mono text-pink-300">{challenge?.otp}</strong> as a Direct Message</li>
                </ol>
              </div>

              <a
                href={`https://ig.me/m/${challenge?.communityAccount}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>Open Instagram DM (@{challenge?.communityAccount})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Live Polling Status Indicator */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-750 mb-4">
              {challengeStatus === 'PENDING' && (
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-pink-500 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Listening for your Instagram DM...</h5>
                    <p className="text-[10px] text-slate-400">Waiting for message delivery via Meta Webhook</p>
                  </div>
                </div>
              )}

              {challengeStatus === 'VERIFYING' && (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <div>
                    <h5 className="text-xs font-bold text-indigo-300">DM Received! Verifying identity...</h5>
                    <p className="text-[10px] text-slate-400">Matching sender username and OTP</p>
                  </div>
                </div>
              )}

              {challengeStatus === 'CHECKING_ELIGIBILITY' && (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300">Checking Live Follower Status...</h5>
                    <p className="text-[10px] text-slate-400">Querying Meta Instagram User Profile API</p>
                  </div>
                </div>
              )}

              {challengeStatus === 'VERIFIED' && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-300">Verified! Logging you in...</h5>
                    <p className="text-[10px] text-slate-400">Follower confirmed. Redirecting to feed.</p>
                  </div>
                </div>
              )}

              {(challengeStatus === 'FAILED' || challengeStatus === 'EXPIRED' || challengeStatus === 'MAX_ATTEMPTS_EXCEEDED') && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-rose-300">
                      {challengeStatus === 'EXPIRED' ? 'Verification Expired' : 'Verification Unsuccessful'}
                    </h5>
                    <p className="text-[11px] text-rose-200 mt-0.5 leading-relaxed">
                      {failureReason || 'Please check that you follow the community account and sent the exact code.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Resend Code with 60s cooldown */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Didn't send it yet?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || loading}
                className="font-bold text-pink-400 hover:text-pink-300 disabled:opacity-40 disabled:hover:text-pink-400 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {cooldownSeconds > 0 ? `Resend code (${cooldownSeconds}s)` : 'Resend code'}
                </span>
              </button>
            </div>

            {/* Safe Local Dev Mode Simulation Widget */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDevSimulator((prev) => !prev)}
                className="flex items-center justify-between w-full text-[11px] font-bold text-slate-400 hover:text-slate-300"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Development Webhook Simulator
                </span>
                {showDevSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDevSimulator && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                  <p className="mb-2 leading-relaxed">
                    While Meta Webhooks / App Review are pending configuration, you can test the full verification, follower check, and instant login right here:
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateDevDm}
                    disabled={simulating || challengeStatus === 'VERIFIED'}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{simulating ? 'Simulating...' : `Simulate DM containing "${challenge?.otp}"`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
