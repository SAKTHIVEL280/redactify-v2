import React, { useState } from 'react';
import { 
  Check, ShieldCheck, Sparkles, KeyRound, ArrowRight, HelpCircle, 
  ChevronDown, ChevronUp, Lock, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useLicenseStore } from '../store/licenseStore';
import { validateLicenseKey } from '../core/license/validator';

export function PricingPage({ onNavigateToStudio }) {
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
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
      activateLicense(inputKey);
    }
  };

  const FAQS = [
    {
      q: "How does the offline license activation work?",
      a: "Redactify uses an elliptic-polynomial cryptographic checksum. When you enter your license key (e.g. RDCT-PRO-XXXX-YYYY), the engine verifies the mathematical signature directly in your browser's V8 engine with zero network calls. You can activate while disconnected from the internet."
    },
    {
      q: "What happens if my document has 100+ pages?",
      a: "The Free Trial allows inspecting unlimited pages and exporting Page 1 with a trial notice. The Pro tier unlocks unlimited page exports (100+ pages) with 100% clean vector streams, true PDF operator scrubbing, and zero watermarks."
    },
    {
      q: "Does Redactify comply with the Indian DPDP Act 2023 & UIDAI Aadhaar circulars?",
      a: "Yes. Under UIDAI circulars, sharing raw 12-digit Aadhaar numbers is restricted. Redactify automatically validates Aadhaar with the Verhoeff dihedral algorithm and masks the first 8 digits (XXXX-XXXX-1234). Because all processing executes in browser memory, you are fully compliant with Section 8 data minimization mandates."
    },
    {
      q: "Can I use Redactify on air-gapped enterprise machines?",
      a: "Yes. All WebAssembly models, Tesseract OCR language weights, and cryptographic parsers are bundled directly into the application bundle. Once loaded, Redactify operates with zero network connectivity."
    }
  ];

  return (
    <div className="w-full bg-[#edede8] text-[#292929] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dbdbd2] text-[#292929] text-xs font-medium border border-[#00000014]">
            <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
            <span>Zero Infrastructure Overhead • 100% Client-Side</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.02em] text-[#141414]">
            Sovereign pricing for private data.
          </h1>
          <p className="text-base text-[#6f6f6e] leading-relaxed">
            Your files never touch a server. Choose a flexible monthly plan or lock in permanent lifetime access with zero recurrent fees.
          </p>

          {/* Currency Switcher Pill */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-[#dbdbd2] border border-[#00000014]">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  currency === 'INR'
                    ? 'bg-[#141414] text-white shadow-sm'
                    : 'text-[#353535] hover:text-[#141414]'
                }`}
              >
                🇮🇳 Domestic (INR ₹)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  currency === 'USD'
                    ? 'bg-[#141414] text-white shadow-sm'
                    : 'text-[#353535] hover:text-[#141414]'
                }`}
              >
                🌍 Global (USD $)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* 1. Free Trial */}
          <div className="bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border border-[#00000014] flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider">Evaluation</span>
                <h3 className="text-xl font-normal text-[#141414] mt-1">Free Trial</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-normal text-[#141414]">{currency === 'INR' ? '₹0' : '$0'}</span>
                  <span className="text-xs text-[#6f6f6e]">/ forever</span>
                </div>
                <p className="text-xs text-[#6f6f6e] mt-2 leading-relaxed">
                  Evaluate client-side detection and redact documents locally in browser memory.
                </p>
              </div>

              <div className="h-px bg-[#0000000f]" />

              <ul className="space-y-3 text-xs text-[#353535]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Unlimited in-memory PII inspection</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>PDF, Word (.docx), and image parsing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Crosshair manual blackout box tool</span>
                </li>
                <li className="flex items-start gap-2.5 text-[#8f8f8e]">
                  <span className="w-4 h-4 text-center shrink-0 mt-0.5">•</span>
                  <span>Export: Page 1 only (with trial watermark)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onNavigateToStudio}
              className="mt-8 w-full h-11 rounded-full bg-[#dbdbd2] hover:bg-[#d0d0c8] text-[#292929] text-xs font-medium border border-[#292929] transition-all flex items-center justify-center gap-2"
            >
              <span>Open Free Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Pro Plan (Featured) */}
          <div className="bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border-2 border-[#141414] relative flex flex-col justify-between shadow-[0_18px_55px_rgba(16,24,40,0.08)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#141414] text-white text-[10px] font-medium tracking-wide uppercase">
              Most Popular • Sovereign Pro
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-medium text-[#4cc02b] uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cc02b]" />
                  Full Commercial License
                </span>
                <h3 className="text-xl font-normal text-[#141414] mt-1">Redactify Pro</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-normal text-[#141414]">
                    {currency === 'INR' ? '₹499' : '$9'}
                  </span>
                  <span className="text-xs text-[#6f6f6e]">/ month</span>
                </div>
                <div className="mt-1 inline-block text-[11px] font-medium text-[#292929] bg-[#dbdbd2] px-2 py-0.5 rounded-full">
                  Or {currency === 'INR' ? '₹999 Early-Bird Lifetime' : '$29 Lifetime Access'}
                </div>
                <p className="text-xs text-[#6f6f6e] mt-2 leading-relaxed">
                  For lawyers, HR recruiters, developers, and founders handling real confidential files.
                </p>
              </div>

              <div className="h-px bg-[#0000000f]" />

              <ul className="space-y-3 text-xs text-[#292929]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span className="font-medium">Unlimited Pages & Batch Multi-Page Exports</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>100% Clean Vector Exports (Zero Watermarks)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>True PDF Operator Scrubbing (Zero Ghost Text)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Offline Tesseract WASM OCR Engine (Zero CDN Egress)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Custom Redaction Styles & Labels ([CONFIDENTIAL])</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Offline Cryptographic Key Activation</span>
                </li>
              </ul>
            </div>

            <button
              onClick={openProModal}
              className="mt-8 w-full h-11 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isPro ? 'Pro Active (Manage License)' : 'Upgrade to Pro'}</span>
            </button>
          </div>

          {/* 3. Enterprise / Legal */}
          <div className="bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border border-[#00000014] flex flex-col justify-between shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider">Organizations</span>
                <h3 className="text-xl font-normal text-[#141414] mt-1">Enterprise Sovereign</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-normal text-[#141414]">
                    {currency === 'INR' ? '₹7,999' : '$99'}
                  </span>
                  <span className="text-xs text-[#6f6f6e]">/ seat / year</span>
                </div>
                <p className="text-xs text-[#6f6f6e] mt-2 leading-relaxed">
                  For law firms, healthcare clinics, and financial institutions requiring air-gapped compliance.
                </p>
              </div>

              <div className="h-px bg-[#0000000f]" />

              <ul className="space-y-3 text-xs text-[#353535]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Everything in Pro for unlimited team members</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Custom regex & organizational taxonomy rules</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Air-gapped on-premise static deployment build</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>DPDP 2023 & GDPR audit compliance report</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#4cc02b] shrink-0 mt-0.5" />
                  <span>Direct founder support (Sakthivel E)</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:sakthivel@daeq.in?subject=Redactify%20Enterprise%20Inquiry"
              className="mt-8 w-full h-11 rounded-full bg-[#dbdbd2] hover:bg-[#d0d0c8] text-[#292929] text-xs font-medium border border-[#292929] transition-all flex items-center justify-center gap-2"
            >
              <span>Contact Founder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Built-in Offline License Activator */}
        <div className="bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border border-[#00000014] shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#141414]" />
                <h3 className="text-base font-normal text-[#141414]">Offline License Key Activation</h3>
              </div>
              <p className="text-xs text-[#6f6f6e] mt-1">
                Already purchased a key? Activate it below. Cryptographic validation occurs 100% client-side without pinging any server.
              </p>
            </div>
            {isPro && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbdbd2] text-[#141414] text-xs font-medium border border-[#00000014]">
                <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
                <span>Active Key: {licenseKey?.slice(0, 12)}...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="e.g. RDCT-PRO-8742-..."
              className="flex-1 px-4 py-2.5 rounded-full bg-[#edede8] border border-[#00000014] text-xs text-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-[#141414]"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all shrink-0"
            >
              Verify & Activate Key
            </button>
          </form>

          {validationResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              validationResult.valid 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {validationResult.valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Success! License verified cryptographic checksum. Tier: <strong>{validationResult.tier}</strong>. Pro features enabled.</span>
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

        {/* Enterprise Security Invariant Table */}
        <div className="bg-[#ffffff] rounded-[12px] p-6 sm:p-8 border border-[#00000014] shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-6">
          <div>
            <span className="text-xs font-medium text-[#6f6f6e] uppercase tracking-wider">Zero-Trust Architecture</span>
            <h3 className="text-xl font-normal text-[#141414] mt-1">Enterprise Security & Compliance Guarantee</h3>
            <p className="text-xs text-[#6f6f6e] mt-1">
              Engineered to satisfy regulatory mandates under the Digital Personal Data Protection (DPDP) Act 2023, EU GDPR, and US HIPAA.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#00000014] text-[#6f6f6e]">
                  <th className="py-3 px-4 font-medium">Security Dimension</th>
                  <th className="py-3 px-4 font-medium">Redactify V2 Guarantee</th>
                  <th className="py-3 px-4 font-medium">Conventional Cloud Uploaders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0000000f] text-[#292929]">
                <tr>
                  <td className="py-3.5 px-4 font-medium">Document Ingestion</td>
                  <td className="py-3.5 px-4 text-[#141414] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>0 Bytes Remote Egress (100% In-Browser Memory)</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#8f8f8e]">Transmitted to AWS / Google Cloud servers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">PDF Ghost Text Sanitization</td>
                  <td className="py-3.5 px-4 text-[#141414] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>Forensic Stream Scrubbing + High-Res Canvas Flattening</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#8f8f8e]">Naive black rectangles (text remains copy-pasteable)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">DOCX Auxiliary Streams</td>
                  <td className="py-3.5 px-4 text-[#141414] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>Scans header1.xml, footer1.xml & wipes docProps metadata</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#8f8f8e]">Only scans document.xml; leaks author & headers</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">OCR Model Weights</td>
                  <td className="py-3.5 px-4 text-[#141414] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>100% Self-Hosted Local WASM (/tessdata, Zero CDN Calls)</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#8f8f8e]">Fetches unpinned scripts from jsDelivr / third-party CDNs</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium">Domain & CORS Boundary</td>
                  <td className="py-3.5 px-4 text-[#141414] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4cc02b]" />
                    <span>Locked strictly to https://redactify.daeq.in (COOP / CORP same-origin)</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#8f8f8e]">Wildcard Access-Control-Allow-Origin: *</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="text-center space-y-1 mb-6">
            <h3 className="text-2xl font-normal text-[#141414]">Frequently Asked Questions</h3>
            <p className="text-xs text-[#6f6f6e]">Everything you need to know about Redactify sovereignty.</p>
          </div>

          {FAQS.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-[#ffffff] rounded-[12px] border border-[#00000014] overflow-hidden transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-[#fafaf8] transition-colors"
              >
                <span className="text-sm font-normal text-[#141414]">{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-[#6f6f6e] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6f6f6e] shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-[#6f6f6e] leading-relaxed border-t border-[#0000000a]">
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
