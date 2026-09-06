import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, CreditCard, KeyRound, Zap } from 'lucide-react';
import { useLicenseStore } from '../store/licenseStore';

export function ProModal() {
  const showProModal = useLicenseStore((s) => s.showProModal);
  const closeProModal = useLicenseStore((s) => s.closeProModal);
  const proModalFeature = useLicenseStore((s) => s.proModalFeature);
  const activateLicense = useLicenseStore((s) => s.activateLicense);
  const exportTrialCallback = useLicenseStore((s) => s.exportTrialCallback);

  const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'license'
  const [licenseInput, setLicenseInput] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  if (!showProModal) return null;

  const handleManualActivation = (e) => {
    e.preventDefault();
    setLicenseError('');
    const cleanKey = licenseInput.trim().toUpperCase();

    if (!cleanKey) {
      setLicenseError('Please enter a license key.');
      return;
    }

    // Support standard RDCT- keys or custom tokens
    if (!cleanKey.startsWith('RDCT-') && cleanKey.length < 12) {
      setLicenseError('Invalid license key format. Expected format: RDCT-XXXX-XXXX-XXXX');
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      activateLicense({
        key: cleanKey,
        type: 'pro_subscription',
        activatedAt: new Date().toISOString()
      });
      setIsActivating(false);
      closeProModal();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-left">
        {/* Close Button */}
        <button
          onClick={closeProModal}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Gradient Banner */}
        <div className="p-6 bg-gradient-to-b from-rose-500/20 via-rose-500/5 to-transparent border-b border-zinc-800/60">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REDACTIFY PRO</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Unlock Full Commercial Power
          </h2>

          <p className="text-xs text-zinc-300 mt-1">
            {proModalFeature === 'multi-page'
              ? 'Multi-page exports are a Pro feature. Upgrade to export your entire clean document with zero watermarks.'
              : 'Redactify Pro gives you unlimited exports, batch processing, and complete zero-trust privacy.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 px-6 pt-2">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'pricing'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'license'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Enter License Key
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pricing' ? (
            <div className="space-y-4">
              {/* Feature Checklist */}
              <div className="grid grid-cols-2 gap-2.5 text-xs text-zinc-300 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Unlimited Pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Zero Watermarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Aadhaar / PAN KYC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Batch Folder Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Custom Color Redaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>True Vector Export</span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Global Plan */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Global (USD)</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-white">$9</span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Billed monthly. Cancel anytime.</p>
                  </div>

                  <a
                    href="https://redactify.daeq.in"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold text-center block transition-all shadow-sm"
                  >
                    Subscribe with Card
                  </a>
                </div>

                {/* India Domestic Plan */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-[9px] font-bold text-white uppercase tracking-wider">
                    India Special
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">India (UPI / Cards)</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-white">₹499</span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>
                    <p className="text-[11px] text-rose-200/70 mt-1">or ₹999 Lifetime Early Access</p>
                  </div>

                  <a
                    href="https://redactify.daeq.in"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 hover:opacity-95 text-white text-xs font-bold text-center block transition-all shadow-md shadow-rose-950/50"
                  >
                    Pay with UPI / GPay
                  </a>
                </div>
              </div>

              {exportTrialCallback && (
                <div className="pt-2 border-t border-zinc-800/80 text-center">
                  <button
                    onClick={() => {
                      const cb = exportTrialCallback;
                      closeProModal();
                      if (cb) cb();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-medium text-center transition-all border border-zinc-700/60"
                  >
                    Continue Free Trial (Download Page 1 with Watermark)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualActivation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Enter Pro License Key:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="RDCT-XXXX-XXXX-XXXX"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 uppercase"
                  />
                </div>
                {licenseError && (
                  <p className="text-xs text-red-400 mt-1.5">{licenseError}</p>
                )}
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Your license key was emailed upon successful checkout.
                </p>
              </div>

              <button
                type="submit"
                disabled={isActivating}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/60 flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>Activate License</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
