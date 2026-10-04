import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, Check, Code2 } from 'lucide-react';
import { REDACTION_LABELS } from '../store/redactionStore';

export function CustomRuleModal({ isOpen, onClose, onSave, editingRule = null }) {
  const [name, setName] = useState('');
  const [pattern, setPattern] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(true);
  const [replacement, setReplacement] = useState('[CONFIDENTIAL]');

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name || '');
      setPattern(editingRule.pattern || '');
      setIsRegex(Boolean(editingRule.isRegex));
      setCaseSensitive(Boolean(editingRule.caseSensitive));
      setWholeWord(editingRule.wholeWord !== undefined ? Boolean(editingRule.wholeWord) : true);
      setReplacement(editingRule.replacement || '[CONFIDENTIAL]');
    } else {
      setName('');
      setPattern('');
      setIsRegex(false);
      setCaseSensitive(false);
      setWholeWord(true);
      setReplacement('[CONFIDENTIAL]');
    }
  }, [editingRule, isOpen]);

  // Live regex syntax validation
  const regexError = useMemo(() => {
    if (!isRegex || !pattern.trim()) return null;
    try {
      new RegExp(pattern.trim());
      return null;
    } catch (err) {
      return err.message;
    }
  }, [isRegex, pattern]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pattern.trim() || regexError) return;

    onSave({
      ...(editingRule ? { id: editingRule.id } : {}),
      name: name.trim() || pattern.trim(),
      pattern: pattern.trim(),
      isRegex,
      caseSensitive,
      wholeWord: isRegex ? false : wholeWord,
      replacement: replacement.trim() || '[CONFIDENTIAL]'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col bg-paper-white border border-stone-mist rounded-card shadow-card-hover overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 border-b border-stone-mist bg-warm-bone flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-charcoal text-white flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-normal text-charcoal">
                {editingRule ? 'Edit Custom Rule' : 'Add Custom Term or Regex'}
              </h3>
              <p className="text-[11px] text-bark-grey font-mono">
                Redact proprietary names, codenames, and patterns
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Rule Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-bark-grey mb-1">
              Rule Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Project Titan, Acme Client Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-soft-cream border border-stone-mist rounded-button px-3 py-2 text-xs font-sans text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
            />
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-bark-grey mb-1">
              Match Mode
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-soft-cream rounded-button border border-stone-mist">
              <button
                type="button"
                onClick={() => setIsRegex(false)}
                className={`py-1.5 text-xs font-mono rounded transition-all ${
                  !isRegex
                    ? 'bg-paper-white text-charcoal shadow-xs font-medium'
                    : 'text-bark-grey hover:text-charcoal'
                }`}
              >
                Plain Keyword
              </button>
              <button
                type="button"
                onClick={() => setIsRegex(true)}
                className={`py-1.5 text-xs font-mono rounded transition-all ${
                  isRegex
                    ? 'bg-paper-white text-charcoal shadow-xs font-medium'
                    : 'text-bark-grey hover:text-charcoal'
                }`}
              >
                Regular Expression (RegEx)
              </button>
            </div>
          </div>

          {/* Pattern Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-bark-grey">
                {isRegex ? 'Regular Expression Pattern' : 'Keyword or Phrase'}
              </label>
              {isRegex && (
                <span className="text-[10px] font-mono text-amber-800">
                  JavaScript RegExp syntax
                </span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder={isRegex ? 'e.g. TITAN-\\d{4}|CLIENT-[A-Z]{3}' : 'e.g. Project Titan'}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className={`w-full bg-soft-cream border rounded-button px-3 py-2 text-xs font-mono text-charcoal placeholder-stone-400 focus:outline-none focus:ring-1 ${
                regexError
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-stone-mist focus:border-charcoal focus:ring-charcoal'
              }`}
            />
            {regexError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{regexError}</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal select-none">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-stone-mist text-charcoal focus:ring-charcoal"
              />
              <span className="font-mono text-[11px]">Match Case Sensitive</span>
            </label>

            {!isRegex && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal select-none">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-stone-mist text-charcoal focus:ring-charcoal"
                />
                <span className="font-mono text-[11px]">Match Whole Words Only</span>
              </label>
            )}
          </div>

          {/* Replacement Text / Badge */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-bark-grey mb-1">
              Redaction Label / Mask Text
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="[CONFIDENTIAL]"
                className="flex-1 bg-soft-cream border border-stone-mist rounded-button px-3 py-1.5 text-xs font-mono text-charcoal focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
              />
            </div>
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {REDACTION_LABELS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setReplacement(lbl)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    replacement === lbl
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-paper-white text-bark-grey border-stone-mist hover:text-charcoal'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-mist flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-button text-xs font-mono text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!pattern.trim() || Boolean(regexError)}
              className="px-4 py-1.5 rounded-button bg-charcoal hover:bg-black disabled:opacity-50 text-white text-xs font-mono font-medium transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingRule ? 'Save Changes' : 'Add Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
