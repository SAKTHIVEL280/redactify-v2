import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

export function FeedbackModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('missed_entity');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    // Store in localStorage for audit & sync
    try {
      const existing = JSON.parse(localStorage.getItem('redactify_user_feedback') || '[]');
      existing.push({
        id: `fb_${Date.now()}`,
        category,
        message: feedbackText.trim(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('redactify_user_feedback', JSON.stringify(existing));
    } catch (err) {}

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText('');
      onClose();
    }, 1500);
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
            <p className="text-xs text-bark-grey mt-1">Saved locally to device storage.</p>
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
                <option value="feature_request">Feature Request / Suggestion</option>
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
                className="w-full bg-soft-cream border border-stone-mist rounded-card p-3 text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-button bg-charcoal hover:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

