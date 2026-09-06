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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#ffffff] border border-[#00000014] rounded-[12px] shadow-[0_18px_55px_rgba(16,24,40,0.12)] overflow-hidden text-left p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f6f6e] hover:text-[#141414] hover:bg-[#edede8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#edede8] text-[#141414] border border-[#00000014] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-normal text-[#141414]">Report missed entity / feedback</h3>
            <p className="text-xs text-[#6f6f6e]">Help improve client-side detection heuristics</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-[#4cc02b] mb-2" />
            <div className="text-sm font-medium text-[#141414]">Feedback logged</div>
            <p className="text-xs text-[#6f6f6e] mt-1">Stored locally in device memory.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#292929] mb-1.5">Feedback Type:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#edede8] border border-[#00000014] rounded-full px-4 py-2 text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
              >
                <option value="missed_entity">Missed Name or Number</option>
                <option value="false_positive">False Detection (Over-redacted)</option>
                <option value="feature_request">Feature Request / Suggestion</option>
                <option value="bug_report">Bug Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#292929] mb-1.5">Details:</label>
              <textarea
                rows={4}
                required
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe what was missed or your suggestion..."
                className="w-full bg-[#edede8] border border-[#00000014] rounded-[8px] p-3 text-xs text-[#141414] placeholder-[#8f8f8e] focus:outline-none focus:border-[#141414]"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-full bg-[#141414] hover:bg-[#292929] text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-2"
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
