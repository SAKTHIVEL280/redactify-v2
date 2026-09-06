import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, CreditCard, KeyRound, Zap, Check } from 'lucide-react';
import { useLicenseStore } from '../store/licenseStore';
import { validateLicenseKey } from '../core/license/validator';

export function ProModal({ onNavigateToPricing }) {
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

    const result = validateLicenseKey(licenseInput);
    if (!result.valid) {
      setLicenseError(result.error);
      return;
    }

    setIsActivating(true);
    setTimeout(() => {
      activateLicense({
        key: result.key,
        tier: result.tier,
        type: `${result.tier.toLowerCase()}_subscription`,
        activatedAt: result.activatedAt
      });
      setIsActivating(false);
      closeProModal();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#ffffff] border border-[#00000014] rounded-[12px] shadow-[0_18px_55px_rgba(16,24,40,0.12)] overflow-hidden text-left">
        {/* Close Button */}
        <button
          onClick={closeProModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f6f6e] hover:text-[#141414] hover:bg-[#edede8] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="p-6 border-b border-[#00000014] bg-[#edede8]/60">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffffff] border border-[#00000014] text-[#292929] text-xs font-medium mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
            <span>Redactify Sovereign Pro</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-normal text-[#141414] tracking-[-0.02em]">
            Unlock commercial capabilities
          </h2>

          <p className="text-xs text-[#6f6f6e] mt-1 leading-relaxed">
            {proModalFeature === 'multi-page'
              ? 'Multi-page exports are a Pro feature. Upgrade to export your entire clean document with zero watermarks.'
              : 'Redactify Pro gives you unlimited exports, batch processing, and complete zero-trust privacy.'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#00000014] px-6 pt-2 bg-[#ffffff]">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 text-xs font-medium transition-all border-b-2 ${
              activeTab === 'pricing'
                ? 'border-[#141414] text-[#141414]'
                : 'border-transparent text-[#6f6f6e] hover:text-[#292929]'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`pb-2.5 px-3 text-xs font-medium transition-all border-b-2 ${
              activeTab === 'license'
                ? 'border-[#141414] text-[#141414]'
                : 'border-transparent text-[#6f6f6e] hover:text-[#292929]'
            }`}
          >
            Enter License Key
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-[#ffffff]">
          {activeTab === 'pricing' ? (
            <div className="space-y-5">
              {/* Feature Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#353535] pb-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>Unlimited Pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>Zero Watermarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>SSN / Passports / IDs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>Word DOCX Redactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>Custom Color Redaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#4cc02b] shrink-0" />
                  <span>True Vector Export</span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pro Monthly */}
                <div className="p-4 rounded-[12px] bg-[#ffffff] border border-[#00000014] flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="text-[10px] font-medium text-[#6f6f6e] uppercase tracking-wider">Pro Monthly</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-normal text-[#141414]">$9</span>
                      <span className="text-xs text-[#6f6f6e]">/ month</span>
                    </div>
                    <p className="text-[11px] text-[#6f6f6e] mt-1">Billed monthly. Cancel anytime.</p>
                  </div>

                  <button
                    onClick={() => {
                      closeProModal();
                      if (onNavigateToPricing) onNavigateToPricing();
                    }}
                    className="mt-4 w-full h-9 rounded-full bg-[#dbdbd2] hover:bg-[#d0d0c8] text-[#292929] text-xs font-medium text-center transition-all border border-[#00000014]"
                  >
                    Select Plan
                  </button>
                </div>

                {/* Lifetime Early-Bird */}
                <div className="p-4 rounded-[12px] bg-[#ffffff] border-2 border-[#141414] relative overflow-hidden flex flex-col justify-between shadow-sm">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#141414] text-[9px] font-medium text-white uppercase tracking-wider">
                    Lifetime
                  </div>

                  <div>
                    <div className="text-[10px] font-medium text-[#141414] uppercase tracking-wider">Lifetime Pass</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-normal text-[#141414]">$29</span>
                      <span className="text-xs text-[#6f6f6e]">one-time</span>
                    </div>
                    <p className="text-[11px] text-[#6f6f6e] mt-1">Pay once, own forever. Zero recurring fees.</p>
                  </div>

                  <button
                    onClick={() => {
                      closeProModal();
                      if (onNavigateToPricing) onNavigateToPricing();
                    }}
                    className="mt-4 w-full h-9 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium text-center transition-all shadow-sm"
                  >
                    Get Lifetime Access
                  </button>
                </div>
              </div>

              {exportTrialCallback && (
                <div className="pt-2 border-t border-[#0000000f] text-center">
                  <button
                    onClick={() => {
                      const cb = exportTrialCallback;
                      closeProModal();
                      if (cb) cb();
                    }}
                    className="w-full h-9 rounded-full bg-[#edede8] hover:bg-[#dbdbd2] text-[#292929] text-xs font-medium text-center transition-all border border-[#00000014]"
                  >
                    Continue Free Trial (Download Page 1 with Watermark)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualActivation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#292929] mb-1.5">
                  Enter Pro License Key:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8f8f8e] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="RDCT-XXXX-XXXX-XXXX"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    className="w-full bg-[#edede8] border border-[#00000014] rounded-full pl-9 pr-3 py-2 text-xs font-mono text-[#141414] placeholder-[#8f8f8e] focus:outline-none focus:border-[#141414] uppercase"
                  />
                </div>
                {licenseError && (
                  <p className="text-xs text-[#c92a2a] mt-1.5">{licenseError}</p>
                )}
                <div className="text-[11px] text-[#6f6f6e] mt-1.5 flex items-center justify-between">
                  <span>Cryptographically verified offline.</span>
                  <button
                    type="button"
                    onClick={() => setLicenseInput('RDCT-PRO-A1B2C3D4-6AB6')}
                    className="text-[#141414] hover:underline font-mono text-[10px]"
                  >
                    Insert Demo Key
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isActivating}
                className="w-full h-10 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
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
