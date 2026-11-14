import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { PlutoLogo } from '../common/PlutoLogo';
import { UserAvatar } from '../common/UserAvatar';
import { playSystemSound } from '../../utils/sound';

export const LockScreen: React.FC = () => {
  const { user, unlockOSWithPassword, setIsLocked } = useOS();
  const [passwordInput, setPasswordInput] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'password' | '2fa'>('password');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsVerifying(true);
    setErrorMsg(null);

    const valid = await unlockOSWithPassword(passwordInput);
    setIsVerifying(false);

    if (valid) {
      playSystemSound('click');
      if (user.twoFactorEnabled) {
        setStep('2fa');
      } else {
        playSystemSound('notification');
        setIsLocked(false);
      }
    } else {
      playSystemSound('error');
      setErrorMsg('Incorrect master password. (Default fallback: pluto2026 or 1234)');
    }
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpInput.length >= 4) {
      playSystemSound('notification');
      setIsLocked(false);
    } else {
      playSystemSound('error');
      setErrorMsg('Please enter a valid 6-digit TOTP authentication code.');
    }
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-slate-100 select-none">
      {/* Brand & Clock Header */}
      <div className="text-center pt-6 space-y-2 flex flex-col items-center">
        <PlutoLogo size={36} showWordmark={true} versionBadge="v2.5.0 LTS" />
        <h1 className="text-6xl font-extrabold font-mono tracking-tight text-white drop-shadow-md pt-2">
          {currentTime}
        </h1>
        <p className="text-sm font-medium text-slate-400">{currentDate}</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm flex flex-col items-center space-y-6">
        <div className="relative">
          <UserAvatar displayName={user.displayName} size="xl" />
          <div className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 rounded-full border border-slate-700 text-cyan-400 shadow-lg">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-base font-bold text-slate-100">{user.displayName}</h2>
          <span className="text-xs text-slate-400 font-mono">Pluto OS Session Protected</span>
        </div>

        {step === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
            <div className="relative">
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter master password"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-lg font-mono"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="absolute right-2 top-2 p-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5 font-mono pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordInput('pluto2026');
                }}
                className="text-[11px] text-cyan-400 hover:underline font-mono"
              >
                Fill Default Password (pluto2026)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit} className="w-full space-y-3">
            <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-center text-xs text-purple-300 space-y-1">
              <ShieldCheck className="w-5 h-5 mx-auto text-purple-400" />
              <p className="font-semibold">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-400">Enter the 6-digit verification code from your authenticator.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={6}
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value)}
                placeholder="000000"
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-center text-base tracking-widest text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 shadow-lg font-mono"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5 font-mono pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setTotpInput('729415')}
                className="text-[11px] text-purple-400 hover:underline font-mono"
              >
                Auto-generate TOTP Token (729415)
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer info */}
      <div className="text-xs text-slate-500 font-mono text-center">
        Pluto OS Enterprise · 256-Bit Hardware Enclave Verified
      </div>
    </div>
  );
};
