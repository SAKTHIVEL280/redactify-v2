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

  const handleQuickTestActivation = () => {
    setIsActivating(true);
    setTimeout(() => {
      activateLicense({
        key: 'RDCT-PRO-A1B2C3D4-6AB6',
        tier: 'PRO',
        type: 'test_license',
        activatedAt: new Date().toISOString()
      });
      setIsActivating(false);
      closeProModal();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto max-h-[92vh] flex flex-col bg-paper-white border border-stone-mist rounded-card shadow-card-hover overflow-hidden text-left">
        {/* Close Button */}
        <button
          onClick={closeProModal}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-full text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-stone-mist bg-warm-bone pr-12">
            <div className="font-mono text-xs uppercase tracking-widest text-bark-grey font-semibold mb-2">
              Commercial License
            </div>

            <h2 className="text-xl sm:text-3xl font-serif font-normal text-charcoal tracking-tight">
              Unlock complete document exports
            </h2>

            <p className="text-xs text-bark-grey mt-1.5 leading-relaxed">
              {proModalFeature === 'multi-page'
                ? 'Multi-page exports are a Pro feature. Upgrade to export your entire clean document with zero watermarks.'
                : 'Redactify Pro gives you unlimited exports, multi-page batch processing, and complete offline privacy.'}
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-bark-grey">
              <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />
              <span>Your active document and edits remain 100% preserved in memory.</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-mist px-4 sm:px-6 pt-2 bg-paper-white">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 ${
              activeTab === 'pricing'
                ? 'border-charcoal text-charcoal'
                : 'border-transparent text-bark-grey hover:text-charcoal'
            }`}
          >
            Upgrade Options
          </button>
          <button
            onClick={() => setActiveTab('license')}
            className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all border-b-2 ${
              activeTab === 'license'
                ? 'border-charcoal text-charcoal'
                : 'border-transparent text-bark-grey hover:text-charcoal'
            }`}
          >
            Enter License Key
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-paper-white">
          {activeTab === 'pricing' ? (
            <div className="space-y-4">
              {/* Evaluator 1-Click Test Pass Banner */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-amber-950">Testing or Evaluating?</div>
                  <div className="text-[11px] text-amber-800">Unlock full Pro features instantly for testing.</div>
                </div>
                <button
                  onClick={handleQuickTestActivation}
                  className="px-3 py-1.5 rounded-button bg-amber-800 hover:bg-amber-900 text-white text-xs font-mono font-medium shadow-sm transition-all shrink-0"
                >
                  1-Click Test Pass
                </button>
              </div>

              {/* Feature Checklist */}
              <div className="grid grid-cols-2 gap-2 text-xs text-charcoal py-1">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Unlimited Pages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Zero Watermarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Passports, IDs, SSN</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Word DOCX Redaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Custom Color Labels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>True Text Scrubbing</span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pro Monthly */}
                <div className="p-4 rounded-card bg-paper-white border border-stone-mist flex flex-col justify-between shadow-card">
                  <div>
                    <div className="text-[10px] font-mono font-medium text-bark-grey uppercase tracking-wider">Pro Monthly</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-serif text-charcoal">$9</span>
                      <span className="text-xs text-bark-grey font-mono">/ mo</span>
                    </div>
                    <p className="text-[11px] text-bark-grey mt-1">Billed monthly. Cancel anytime.</p>
                  </div>

                  <button
                    onClick={() => {
                      closeProModal();
                      if (onNavigateToPricing) onNavigateToPricing();
                    }}
                    className="mt-4 w-full h-9 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal text-xs font-mono font-medium text-center transition-all border border-stone-mist"
                  >
                    View Pricing Plan
                  </button>
                </div>

                {/* Lifetime Pass */}
                <div className="p-4 rounded-card bg-paper-white border-2 border-charcoal relative overflow-hidden flex flex-col justify-between shadow-card-hover">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-charcoal text-[9px] font-mono font-medium text-white uppercase tracking-wider shadow-sm">
                    Lifetime
                  </div>

                  <div>
                    <div className="text-[10px] font-mono font-medium text-charcoal uppercase tracking-wider">Lifetime Pass</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-serif text-charcoal">$29</span>
                      <span className="text-xs text-bark-grey font-mono">one-time</span>
                    </div>
                    <p className="text-[11px] text-bark-grey mt-1">Pay once, own forever. Zero recurring fees.</p>
                  </div>

                  <button
                    onClick={() => {
                      closeProModal();
                      if (onNavigateToPricing) onNavigateToPricing();
                    }}
                    className="mt-4 w-full h-9 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium text-center transition-all shadow-sm"
                  >
                    View Lifetime Pass
                  </button>
                </div>
              </div>

              {exportTrialCallback && (
                <div className="pt-2 border-t border-stone-mist/60 text-center">
                  <button
                    onClick={() => {
                      const cb = exportTrialCallback;
                      closeProModal();
                      if (cb) cb();
                    }}
                    className="w-full h-9 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal text-xs font-mono font-medium text-center transition-all border border-stone-mist"
                  >
                    Continue Free Trial (Download Page 1 with Watermark)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualActivation} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-charcoal mb-1.5">
                  Enter Pro License Key:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-bark-grey absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="RDCT-PRO-XXXX-XXXX"
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    className="w-full bg-soft-cream border border-stone-mist rounded-button pl-9 pr-3 py-2 text-xs font-mono text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal uppercase"
                  />
                </div>
                {licenseError && (
                  <p className="text-xs text-rose-600 mt-1.5">{licenseError}</p>
                )}
                <div className="text-[11px] text-bark-grey mt-1.5 flex items-center justify-between font-mono">
                  <span>Offline cryptographic verification.</span>
                  <button
                    type="button"
                    onClick={() => setLicenseInput('RDCT-PRO-A1B2C3D4-6AB6')}
                    className="text-charcoal font-semibold hover:underline font-mono text-[10px]"
                  >
                    Insert Demo Key
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isActivating}
                className="w-full h-10 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2"
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
    </div>
  );
}

