import React, { useState } from 'react';
import { 
  Check, ShieldCheck, Sparkles, KeyRound, ArrowRight, HelpCircle, 
  ChevronDown, ChevronUp, Lock, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useLicenseStore } from '../store/licenseStore';
import { useDocumentStore } from '../store/documentStore';
import { validateLicenseKey } from '../core/license/validator';

export function PricingPage({ onNavigateToStudio }) {
  const file = useDocumentStore((s) => s.file);
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'INR'
  const [inputKey, setInputKey] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const { isPro, licenseKey, activateLicense, openProModal } = useLicenseStore();

  const handleActivate = (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    const res = validateLicenseKey(inputKey);
    setValidationResult(res);
    if (res.valid) {
      activateLicense({
        key: res.key,
        tier: res.tier,
        type: `${res.tier.toLowerCase()}_subscription`,
        activatedAt: res.activatedAt
      });
    }
  };

  const FAQS = [
    {
      q: "How does offline license activation work?",
      a: "Redactify uses an offline cryptographic check. When you paste your key (e.g. RDCT-PRO-XXXX-YYYY), your browser verifies the mathematical signature immediately with zero network requests. You can activate while disconnected from Wi-Fi."
    },
    {
      q: "What happens if my document has dozens of pages?",
      a: "The Free plan lets you inspect unlimited pages in your browser and download Page 1 with a trial notice. The Pro plan unlocks full multi-page document downloads with 100% clean vector text and zero watermarks."
    },
    {
      q: "Does Redactify comply with global privacy rules (GDPR, HIPAA, SOC 2)?",
      a: "Yes. Because Redactify processes everything strictly inside your computer browser memory, your files never travel across the internet or touch third-party servers. It naturally meets GDPR data residency guidelines and HIPAA de-identification standards."
    },
    {
      q: "Can I use Redactify on secure or air-gapped office computers?",
      a: "Yes. All detection rules, optical OCR weights, and PDF renderers are packaged directly into the website bundle. Once loaded in your browser, it runs completely offline without any internet connection."
    }
  ];

  return (
    <div className="w-full bg-warm-bone text-charcoal py-8 sm:py-16 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Active Document Return Banner */}
        {file && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-soft-cream border border-stone-mist flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 text-charcoal">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span>
                You have an active document in Studio (<strong>{file.name}</strong>). Your redactions and zoom are safe in browser memory.
              </span>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="px-4 py-1.5 rounded-button bg-charcoal hover:bg-black text-white font-mono font-medium text-xs transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <span>Return to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <div className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-bark-grey font-semibold">
            100% Client-Side • Zero Cloud Servers
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-charcoal">
            Simple pricing for <span className="italic text-amber-800">serious privacy</span>.
          </h1>
          <p className="text-base text-bark-grey leading-relaxed">
            Your files never leave your computer. Choose a flexible monthly plan or lock in permanent lifetime access with zero recurrent fees.
          </p>

          {/* Currency Switcher Pill */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-soft-cream border border-stone-mist">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                  currency === 'USD'
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'text-bark-grey hover:text-charcoal'
                }`}
              >
                Global (USD $)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                  currency === 'INR'
                    ? 'bg-charcoal text-white shadow-sm'
                    : 'text-bark-grey hover:text-charcoal'
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:max-w-xl md:mx-auto lg:max-w-none items-stretch">
          
          {/* 1. Free Trial */}
          <div className="bg-paper-white rounded-card p-6 sm:p-8 border border-stone-mist flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono font-medium text-bark-grey uppercase tracking-wider">Evaluation</span>
                <h3 className="text-2xl font-serif font-normal text-charcoal mt-1">Free Trial</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-serif text-charcoal">{currency === 'INR' ? '₹0' : '$0'}</span>
                  <span className="text-xs text-bark-grey font-mono">/ forever</span>
                </div>
                <p className="text-xs text-bark-grey mt-2 leading-relaxed">
                  Inspect sensitive items and test redactions directly in browser memory.
                </p>
              </div>

              <div className="h-px bg-stone-mist/60" />

              <ul className="space-y-3 text-xs text-charcoal">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Unlimited in-browser entity scans</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>PDF, Word (.docx), and scan files</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Crosshair manual blackout tool</span>
                </li>
                <li className="flex items-start gap-2.5 text-bark-grey">
                  <span className="w-4 h-4 text-center shrink-0 mt-0.5 font-mono">•</span>
                  <span>Export: Page 1 only (watermarked)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onNavigateToStudio}
              className="mt-8 w-full h-11 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal text-xs font-mono font-medium border border-stone-mist transition-all flex items-center justify-center gap-2"
            >
              <span>Open Free Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Pro Plan (Featured & High-Contrast POP) */}
          <div className="bg-paper-white rounded-card p-6 sm:p-8 border-2 border-charcoal relative flex flex-col justify-between shadow-card-hover">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-charcoal text-white text-[10px] font-mono font-medium tracking-wide uppercase shadow-sm whitespace-nowrap">
              Most Popular • Full License
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-medium text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-charcoal" />
                  Commercial License
                </span>
                <h3 className="text-2xl font-serif font-normal text-charcoal mt-1">Redactify Pro</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-serif text-charcoal">
                    {currency === 'INR' ? '₹499' : '$9'}
                  </span>
                  <span className="text-xs text-bark-grey font-mono">/ month</span>
                </div>
                <div className="mt-2 inline-block text-[11px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                  Or {currency === 'INR' ? '₹999 Lifetime Pass' : '$29 Lifetime Pass'}
                </div>
                <p className="text-xs text-bark-grey mt-2 leading-relaxed">
                  For lawyers, HR teams, developers, and founders handling confidential documents.
                </p>
              </div>

              <div className="h-px bg-stone-mist/60" />

              <ul className="space-y-3 text-xs text-charcoal">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span className="font-medium">Unlimited Pages & Batch Multi-Page Exports</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>100% Clean Vector Exports (Zero Watermarks)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>True PDF Text Scrubbing (Zero Ghost Text)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Offline OCR Engine (Runs 100% in Browser)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Custom Redaction Styles & Blackout Labels</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Offline Cryptographic Key Verification</span>
                </li>
              </ul>
            </div>

            <button
              onClick={openProModal}
              className="mt-8 w-full h-11 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPro ? 'Pro Active (Manage License)' : 'Upgrade to Pro'}</span>
            </button>
          </div>

          {/* 3. Enterprise / Legal */}
          <div className="bg-paper-white rounded-card p-6 sm:p-8 border border-stone-mist flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono font-medium text-bark-grey uppercase tracking-wider">Organizations</span>
                <h3 className="text-2xl font-serif font-normal text-charcoal mt-1">Enterprise</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-serif text-charcoal">
                    {currency === 'INR' ? '₹7,999' : '$99'}
                  </span>
                  <span className="text-xs text-bark-grey font-mono">/ seat / year</span>
                </div>
                <p className="text-xs text-bark-grey mt-2 leading-relaxed">
                  For law firms, medical practices, and enterprises needing air-gapped compliance.
                </p>
              </div>

              <div className="h-px bg-stone-mist/60" />

              <ul className="space-y-3 text-xs text-charcoal">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Everything in Pro for unlimited seats</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Custom regex and company pattern rules</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Air-gapped on-premise static deployment</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>GDPR, HIPAA, and ISO 27001 audit report</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Dedicated engineering support & SLA</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20Inquiry"
              className="mt-8 w-full h-11 rounded-button bg-soft-cream hover:bg-stone-mist/40 text-charcoal text-xs font-mono font-medium border border-stone-mist transition-all flex items-center justify-center gap-2"
            >
              <span>Contact Team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Built-in Offline License Activator */}
        <div className="bg-paper-white rounded-card p-6 sm:p-8 border border-stone-mist shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-charcoal" />
                <h3 className="text-base font-medium text-charcoal">Offline License Key Activation</h3>
              </div>
              <p className="text-xs text-bark-grey mt-1">
                Already purchased a key? Activate it below. Cryptographic verification runs 100% inside your browser without contacting any server.
              </p>
            </div>
            {isPro && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-mono font-medium border border-amber-200">
                <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span>Active Key: {typeof licenseKey === 'string' ? licenseKey.slice(0, 12) : licenseKey?.key?.slice(0, 12)}...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="e.g. RDCT-PRO-8742-..."
              className="flex-1 px-4 py-2.5 rounded-button bg-soft-cream border border-stone-mist text-xs text-charcoal font-mono focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shrink-0"
            >
              Verify & Activate Key
            </button>
          </form>

          {validationResult && (
            <div className={`p-3 rounded-button text-xs flex items-center gap-2 ${
              validationResult.valid 
                ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Success! Offline signature verified. Tier: <strong>{validationResult.tier}</strong>. Pro features unlocked.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationResult.error || 'Invalid cryptographic license key.'}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Enterprise Security Comparison Table */}
        <div className="bg-paper-white rounded-card p-4 sm:p-8 border border-stone-mist shadow-card space-y-6">
          <div>
            <span className="text-[11px] font-mono font-medium text-bark-grey uppercase tracking-wider">Zero-Trust Architecture</span>
            <h3 className="text-xl sm:text-2xl font-serif font-normal text-charcoal mt-1">Enterprise Security & Privacy Guarantee</h3>
            <p className="text-xs text-bark-grey mt-1">
              Built to meet strict standards under global privacy laws including EU GDPR, US HIPAA, and international data residency rules.
            </p>
          </div>

          <div className="sm:hidden text-[10px] font-mono text-bark-grey text-right pb-1">
            Swipe horizontally →
          </div>
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left text-xs border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-stone-mist text-bark-grey font-mono uppercase">
                  <th className="py-3 px-4 font-medium">Security Dimension</th>
                  <th className="py-3 px-4 font-semibold text-charcoal">Redactify V2 Guarantee</th>
                  <th className="py-3 px-4 font-medium">Conventional Cloud Uploaders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-mist/60 text-charcoal">
                <tr>
                  <td className="py-3.5 px-4 font-medium">File Processing</td>
                  <td className="py-3.5 px-4 text-charcoal font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>0 Bytes Uploaded (100% In Browser Memory)</span>
                  </td>
                  <td className="py-3.5 px-4 text-bark-grey">Uploaded to remote cloud servers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">PDF Ghost Text Removal</td>
                  <td className="py-3.5 px-4 text-charcoal font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>True Text Stream Scrubbing + Flattening</span>
                  </td>
                  <td className="py-3.5 px-4 text-bark-grey">Simple black rectangles (text remains copy-pasteable)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Word DOCX Auxiliary Streams</td>
                  <td className="py-3.5 px-4 text-charcoal font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cleans headers, footers & strips document author metadata</span>
                  </td>
                  <td className="py-3.5 px-4 text-bark-grey">Only scans body text; leaks author & headers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">OCR Image Processing</td>
                  <td className="py-3.5 px-4 text-charcoal font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>100% Self-Hosted Local WebAssembly Engine</span>
                  </td>
                  <td className="py-3.5 px-4 text-bark-grey">Loads unverified third-party CDN scripts</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Domain & CORS Boundary</td>
                  <td className="py-3.5 px-4 text-charcoal font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700" />
                    <span>Locked strictly to https://redactify.daeq.in</span>
                  </td>
                  <td className="py-3.5 px-4 text-bark-grey">Wildcard cross-origin headers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center space-y-1 mb-6">
            <h3 className="text-2xl font-serif font-normal text-charcoal">Frequently Asked Questions</h3>
            <p className="text-xs text-bark-grey">Clear answers about security, licensing, and compliance.</p>
          </div>

          {FAQS.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-paper-white rounded-card border border-stone-mist overflow-hidden transition-all shadow-card"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-soft-cream transition-colors"
              >
                <span className="text-sm font-medium text-charcoal">{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-bark-grey shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-bark-grey shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-bark-grey leading-relaxed border-t border-stone-mist/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
