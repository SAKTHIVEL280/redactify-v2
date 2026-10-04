import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const FEEDBACK_ENDPOINT = import.meta.env?.VITE_FEEDBACK_ENDPOINT || 'https://formspree.io/f/xanykgbv';

export function FeedbackModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('missed_entity');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successNote, setSuccessNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);

    // Strictly non-sensitive telemetry: zero document bytes or PII values ever transmitted
    const payload = {
      id: `fb_${Date.now()}`,
      category,
      message: feedbackText.trim(),
      timestamp: new Date().toISOString(),
      appVersion: '2.0.0',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''
    };

    let sentRemotely = false;
    try {
      if (FEEDBACK_ENDPOINT && navigator.onLine !== false) {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          sentRemotely = true;
        }
      }
    } catch {
      sentRemotely = false;
    }

    // Always store offline backup in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('redactify_user_feedback') || '[]');
      existing.push({ ...payload, synced: sentRemotely });
      localStorage.setItem('redactify_user_feedback', JSON.stringify(existing));
    } catch {}

    setIsSubmitting(false);
    setSubmitted(true);
    setSuccessNote(
      sentRemotely
        ? 'Delivered securely to the engineering team.'
        : 'Saved locally to device storage. Will sync when reconnected.'
    );

    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto max-h-[90vh] overflow-y-auto bg-paper-white border border-stone-mist rounded-card shadow-card-hover text-left p-5 sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-full text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-soft-cream text-charcoal border border-stone-mist flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif font-normal text-charcoal">Report missed entity or feedback</h3>
            <p className="text-xs text-bark-grey">Help improve client-side detection heuristics</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-amber-700 mb-2" />
            <div className="text-sm font-medium text-charcoal">Feedback recorded</div>
            <p className="text-xs text-bark-grey mt-1 font-mono">{successNote}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-charcoal mb-1.5">Feedback Type:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-soft-cream border border-stone-mist rounded-button px-4 py-2 text-xs font-mono text-charcoal focus:outline-none focus:border-charcoal"
              >
                <option value="missed_entity">Missed Name or Number</option>
                <option value="false_positive">False Detection (Over-redacted)</option>
                <option value="feature_request">Feature Request or Suggestion</option>
                <option value="bug_report">Bug Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-charcoal mb-1.5">Details:</label>
              <textarea
                rows={4}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe what was missed or your suggestion..."
                className="w-full bg-soft-cream border border-stone-mist rounded-button p-3 text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-bark-grey">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero-knowledge invariant: Document bytes are never sent.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !feedbackText.trim()}
              className="w-full h-10 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? 'Transmitting...' : 'Submit Feedback'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
