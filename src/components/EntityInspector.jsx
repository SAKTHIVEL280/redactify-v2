import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, CheckSquare, Square, Trash2, MessageSquarePlus, Filter, ChevronDown } from 'lucide-react';
import { useRedactionStore } from '../store/redactionStore';
import { PRESETS } from '../core/engine/presets';

export function EntityInspector({ onOpenFeedback }) {
  const redactions = useRedactionStore((s) => s.redactions);
  const toggleRedaction = useRedactionStore((s) => s.toggleRedaction);
  const removeRedaction = useRedactionStore((s) => s.removeRedaction);
  const toggleAllRedactions = useRedactionStore((s) => s.toggleAllRedactions);
  const activePreset = useRedactionStore((s) => s.activePreset);
  const setActivePreset = useRedactionStore((s) => s.setActivePreset);

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
    <aside className="w-80 border-l border-[#00000014] bg-[#ffffff] flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#00000014] flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-[#141414] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4cc02b]" />
            <span>Entity Inspector</span>
          </div>
          <p className="text-[11px] text-[#6f6f6e] mt-0.5">
            {redactions.length} items detected
          </p>
        </div>

        <button
          onClick={() => toggleAllRedactions(!allSelected)}
          className="text-[11px] font-medium text-[#141414] hover:underline transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-[#00000014] space-y-2">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#0000000a]">
          <span className="text-[10px] uppercase font-semibold text-[#6f6f6e] tracking-wider">
            Preset:
          </span>
          <div className="relative flex-1 max-w-[190px]">
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="w-full appearance-none bg-[#edede8] border border-[#00000014] rounded-full px-2.5 py-1 pr-6 text-[11px] text-[#141414] font-medium focus:outline-none cursor-pointer truncate hover:bg-[#dbdbd2] transition-colors"
            >
              {Object.values(PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#6f6f6e] absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8f8f8e] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search detected text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#edede8] border border-[#00000014] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#141414] placeholder-[#8f8f8e] focus:outline-none focus:border-[#141414] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#141414] text-white'
                  : 'bg-[#edede8] text-[#353535] hover:text-[#141414]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#0000000a]">
        {filteredRedactions.length === 0 ? (
          <div className="text-center py-12 text-[#8f8f8e] text-xs">
            No entities match your filter.
          </div>
        ) : (
          filteredRedactions.map((r) => (
            <div
              key={r.id}
              onClick={() => toggleRedaction(r.id)}
              className={`p-2.5 rounded-[8px] cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                r.redact
                  ? 'bg-[#edede8]/60 hover:bg-[#edede8] border border-[#0000000f]'
                  : 'bg-transparent hover:bg-[#edede8]/30 border border-transparent opacity-40'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 text-[#141414]">
                  {r.redact ? (
                    <CheckSquare className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#8f8f8e]" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-[#ffffff] text-[#141414] border border-[#00000014]">
                      {r.entityType || r.category}
                    </span>
                    {r.type === 'manual' && (
                      <span className="text-[9px] text-[#141414] font-medium font-mono px-1 rounded bg-[#dbdbd2]">
                        MANUAL
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-[#141414] truncate mt-1">
                    {r.value}
                  </div>

                  {r.suggested && (
                    <div className="text-[10px] text-[#6f6f6e] font-mono mt-0.5 truncate">
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
                  className="p-1 rounded text-[#8f8f8e] hover:text-[#c92a2a] hover:bg-[#dbdbd2] opacity-0 group-hover:opacity-100 transition-all"
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
      <div className="p-3 border-t border-[#00000014] bg-[#ffffff]">
        <button
          onClick={onOpenFeedback}
          className="w-full py-2 px-3 rounded-full bg-[#edede8] hover:bg-[#dbdbd2] border border-[#00000014] text-[#292929] text-xs font-medium flex items-center justify-center gap-2 transition-all"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-[#141414]" />
          <span>Report Missed Text / Feedback</span>
        </button>
      </div>
    </aside>
  );
}
