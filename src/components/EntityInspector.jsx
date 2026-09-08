import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, CheckSquare, Square, Trash2, MessageSquarePlus, Filter, ChevronDown, X } from 'lucide-react';
import { useRedactionStore } from '../store/redactionStore';
import { PRESETS } from '../core/engine/presets';

export function EntityInspector({ onOpenFeedback }) {
  const redactions = useRedactionStore((s) => s.redactions);
  const toggleRedaction = useRedactionStore((s) => s.toggleRedaction);
  const removeRedaction = useRedactionStore((s) => s.removeRedaction);
  const toggleAllRedactions = useRedactionStore((s) => s.toggleAllRedactions);
  const activePreset = useRedactionStore((s) => s.activePreset);
  const setActivePreset = useRedactionStore((s) => s.setActivePreset);
  const isInspectorOpen = useRedactionStore((s) => s.isInspectorOpen);
  const toggleInspector = useRedactionStore((s) => s.toggleInspector);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredRedactions = useMemo(() => {
    return redactions.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.entityType?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat =
        selectedCategory === 'all' || r.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [redactions, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(redactions.map((r) => r.category));
    return ['all', ...Array.from(set)];
  }, [redactions]);

  const allSelected = redactions.length > 0 && redactions.every((r) => r.redact);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isInspectorOpen && (
        <div 
          onClick={toggleInspector}
          className="fixed inset-0 bg-charcoal/30 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
          aria-hidden="true"
        />
      )}

      <aside className={`w-full max-w-[320px] sm:max-w-xs md:w-80 border-l border-stone-mist bg-paper-white flex flex-col h-full shrink-0 select-none transition-all duration-200 ${
        !isInspectorOpen ? 'hidden' : 'flex'
      } fixed inset-y-14 right-0 z-40 md:relative md:inset-y-0 shadow-2xl md:shadow-none`}>
      {/* Header */}
      <div className="p-4 border-b border-stone-mist flex items-center justify-between">
        <div>
          <div className="text-xs font-mono font-semibold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Entity Inspector</span>
          </div>
          <p className="text-[11px] text-bark-grey mt-0.5 font-mono">
            <span className="text-charcoal font-semibold">{redactions.length}</span> items detected
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAllRedactions(!allSelected)}
            className="text-[11px] font-mono font-medium text-charcoal hover:underline transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={toggleInspector}
            className="md:hidden p-1 rounded-full text-bark-grey hover:text-charcoal hover:bg-stone-mist/30 transition-colors"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-stone-mist space-y-2">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-mist/40">
          <span className="text-[10px] uppercase font-mono font-semibold text-bark-grey tracking-wider">
            Preset:
          </span>
          <div className="relative flex-1 max-w-[190px]">
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="w-full appearance-none bg-soft-cream border border-stone-mist rounded-button px-2.5 py-1 pr-6 text-[11px] text-charcoal font-mono font-medium focus:outline-none cursor-pointer truncate hover:bg-stone-mist/30 transition-colors"
            >
              {Object.values(PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-bark-grey absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-bark-grey absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search detected text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-soft-cream border border-stone-mist rounded-button pl-8 pr-3 py-1.5 text-xs text-charcoal placeholder-stone-400 focus:outline-none focus:border-charcoal font-mono transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-charcoal text-white'
                  : 'bg-soft-cream text-bark-grey hover:text-charcoal border border-stone-mist'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-stone-mist/40">
        {filteredRedactions.length === 0 ? (
          <div className="text-center py-12 text-bark-grey text-xs font-mono">
            No entities match your filter.
          </div>
        ) : (
          filteredRedactions.map((r) => (
            <div
              key={r.id}
              onClick={() => toggleRedaction(r.id)}
              className={`p-2.5 rounded-card cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                r.redact
                  ? 'bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist'
                  : 'bg-transparent hover:bg-soft-cream/50 border border-transparent opacity-40'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 text-charcoal">
                  {r.redact ? (
                    <CheckSquare className="w-3.5 h-3.5 text-charcoal" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-bark-grey" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-paper-white text-charcoal border border-stone-mist">
                      {r.entityType || r.category}
                    </span>
                    {r.type === 'manual' && (
                      <span className="text-[9px] text-terracotta font-medium font-mono px-1 rounded bg-terracotta/10 border border-terracotta/30">
                        MANUAL
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-charcoal truncate mt-1">
                    {r.value}
                  </div>

                  {r.suggested && (
                    <div className="text-[10px] text-bark-grey font-mono mt-0.5 truncate">
                      → {r.suggested}
                    </div>
                  )}
                </div>
              </div>

              {r.type === 'manual' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRedaction(r.id);
                  }}
                  className="p-1 rounded-button text-bark-grey hover:text-rose-600 hover:bg-stone-mist/40 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove manual box"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Feedback Footer */}
      <div className="p-3 border-t border-stone-mist bg-paper-white">
        <button
          onClick={onOpenFeedback}
          className="w-full py-2 px-3 rounded-button bg-soft-cream hover:bg-stone-mist/40 border border-stone-mist text-charcoal text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-charcoal" />
          <span>Report Missed Text / Feedback</span>
        </button>
      </div>
    </aside>
    </>
  );
}
