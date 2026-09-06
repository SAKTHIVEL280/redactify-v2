import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, CheckSquare, Square, Trash2, MessageSquarePlus, Filter } from 'lucide-react';
import { useRedactionStore } from '../store/redactionStore';

export function EntityInspector({ onOpenFeedback }) {
  const redactions = useRedactionStore((s) => s.redactions);
  const toggleRedaction = useRedactionStore((s) => s.toggleRedaction);
  const removeRedaction = useRedactionStore((s) => s.removeRedaction);
  const toggleAllRedactions = useRedactionStore((s) => s.toggleAllRedactions);

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
    <aside className="w-80 border-l border-zinc-800/80 bg-zinc-950 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
            <span>Entity Inspector</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {redactions.length} items detected
          </p>
        </div>

        <button
          onClick={() => toggleAllRedactions(!allSelected)}
          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search detected text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-900/50">
        {filteredRedactions.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No entities match your filter.
          </div>
        ) : (
          filteredRedactions.map((r) => (
            <div
              key={r.id}
              onClick={() => toggleRedaction(r.id)}
              className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                r.redact
                  ? 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60'
                  : 'bg-transparent hover:bg-zinc-900/30 border border-transparent opacity-50'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 text-rose-500">
                  {r.redact ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      {r.entityType || r.category}
                    </span>
                    {r.type === 'manual' && (
                      <span className="text-[9px] text-amber-400 font-semibold font-mono">
                        MANUAL
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-zinc-200 truncate mt-1">
                    {r.value}
                  </div>

                  {r.suggested && (
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
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
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove manual box"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Missed Word / Feedback Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950">
        <button
          onClick={onOpenFeedback}
          className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-rose-400" />
          <span>Report Missed Text / Feedback</span>
        </button>
      </div>
    </aside>
  );
}
