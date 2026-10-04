import { create } from 'zustand';
import { PRESETS } from '../core/engine/presets.js';

export const REDACTION_COLORS = [
  { id: 'black', label: 'Solid Black', hex: '#09090b', textHex: '#ffffff' },
  { id: 'zinc', label: 'Charcoal', hex: '#27272a', textHex: '#fafafa' },
  { id: 'white', label: 'White-out', hex: '#ffffff', textHex: '#09090b' },
  { id: 'navy', label: 'Navy Blue', hex: '#1e293b', textHex: '#f8fafc' },
  { id: 'red', label: 'Audit Red', hex: '#dc2626', textHex: '#ffffff' }
];

export const REDACTION_LABELS = [
  '[REDACTED]',
  '[CONFIDENTIAL]',
  '[PII MASKED]',
  '[AADHAAR MASKED]',
  '[CLIENT PRIVILEGED]'
];

function loadStoredCustomRules() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('redactify_custom_rules');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCustomRules(rules) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('redactify_custom_rules', JSON.stringify(rules));
  } catch {}
}

export const useRedactionStore = create((set, get) => ({
  // Array of normalized bounding boxes { id, pageIndex, x, y, width, height, type: 'auto'|'manual', category, value, suggested, redact: boolean }
  redactions: [],
  activePreset: 'all',
  
  // Customization Options
  style: {
    color: '#09090b',
    textColor: '#ffffff',
    label: '[REDACTED]',
    showLabel: false,
    mode: 'blackout', // 'blackout' | 'label'
    exportMode: 'raster' // 'raster' (forensic flattening) | 'vector' (crisp searchable text)
  },

  // Manual box creation tool active
  isDrawingMode: false,
  selectedRedactionId: null,
  isInspectorOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),

  // Custom regex/keyword rules with persistence
  customRules: loadStoredCustomRules(),

  // Undo / Redo Stacks
  history: [],
  future: [],

  // Push to history before mutating
  _recordHistory: () => {
    const current = get().redactions;
    set((state) => ({
      history: [...state.history.slice(-20), current],
      future: []
    }));
  },

  setRedactions: (redactions) => {
    get()._recordHistory();
    set({ redactions });
  },

  addRedaction: (box) => {
    get()._recordHistory();
    const newBox = {
      id: box?.id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: box?.type || 'manual',
      category: box?.category || 'manual',
      value: box?.value || 'Manual Redaction',
      suggested: box?.suggested || get().style.label || '[REDACTED]',
      redact: box?.redact !== undefined ? box.redact : true,
      ...box
    };
    set((state) => ({
      redactions: [...state.redactions, newBox]
    }));
  },

  addManualRedaction: (box) => get().addRedaction(box),

  toggleRedaction: (id) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) =>
        r.id === id ? { ...r, redact: !r.redact } : r
      )
    }));
  },

  toggleAllRedactions: (redact) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) => ({ ...r, redact }))
    }));
  },

  removeRedaction: (id) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.filter((r) => r.id !== id),
      selectedRedactionId: state.selectedRedactionId === id ? null : state.selectedRedactionId
    }));
  },

  updateRedaction: (id, updates) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },

  setActivePreset: (presetId) => {
    set({ activePreset: presetId });
    const preset = PRESETS[presetId];
    if (!preset) return;

    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) => {
        if (r.type === 'manual') return r;
        const matchesCategory = preset.categories.includes('all') || preset.categories.includes(r.category);
        return {
          ...r,
          redact: matchesCategory
        };
      })
    }));
  },

  setStyle: (newStyle) => set((state) => ({
    style: { ...state.style, ...newStyle }
  })),

  setDrawingMode: (enabled) => set({ isDrawingMode: enabled }),

  setSelectedRedactionId: (id) => set({ selectedRedactionId: id }),

  // Custom Rules CRUD with localStorage persistence
  addCustomRule: (rule) => set((state) => {
    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: rule.name?.trim() || rule.pattern.trim(),
      pattern: rule.pattern.trim(),
      isRegex: Boolean(rule.isRegex),
      caseSensitive: Boolean(rule.caseSensitive),
      wholeWord: rule.wholeWord !== undefined ? Boolean(rule.wholeWord) : true,
      replacement: rule.replacement || '[CONFIDENTIAL]',
      enabled: true,
      ...rule
    };
    const updated = [...state.customRules, newRule];
    saveStoredCustomRules(updated);
    return { customRules: updated };
  }),

  updateCustomRule: (id, updates) => set((state) => {
    const updated = state.customRules.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveStoredCustomRules(updated);
    return { customRules: updated };
  }),

  toggleCustomRule: (id) => set((state) => {
    const updated = state.customRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    saveStoredCustomRules(updated);
    return { customRules: updated };
  }),

  removeCustomRule: (id) => set((state) => {
    const updated = state.customRules.filter((r) => r.id !== id);
    saveStoredCustomRules(updated);
    return { customRules: updated };
  }),

  // Undo & Redo Engine
  undo: () => {
    const { history, future, redactions } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      future: [redactions, ...future],
      redactions: previous
    });
  },

  redo: () => {
    const { history, future, redactions } = get();
    if (future.length === 0) return;

    const next = future[0];
    set({
      history: [...history, redactions],
      future: future.slice(1),
      redactions: next
    });
  },

  clearRedactions: () => set({
    redactions: [],
    history: [],
    future: [],
    selectedRedactionId: null
  })
}));
