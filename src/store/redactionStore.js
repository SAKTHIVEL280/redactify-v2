import { create } from 'zustand';

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
    mode: 'blackout' // 'blackout' | 'label'
  },

  // Manual box creation tool active
  isDrawingMode: false,
  selectedRedactionId: null,

  // Custom regex/keyword rules
  customRules: [],

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
    set((state) => ({
      redactions: [...state.redactions, box]
    }));
  },

  toggleRedaction: (id) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) =>
        r.id === id ? { ...r, redact: !r.redact } : r
      )
    }));
  },

  removeRedaction: (id) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.filter((r) => r.id !== id),
      selectedRedactionId: state.selectedRedactionId === id ? null : state.selectedRedactionId
    }));
  },

  toggleAllRedactions: (enable) => {
    get()._recordHistory();
    set((state) => ({
      redactions: state.redactions.map((r) => ({ ...r, redact: enable }))
    }));
  },

  setActivePreset: (presetId) => set({ activePreset: presetId }),

  setStyle: (newStyle) => set((state) => ({
    style: { ...state.style, ...newStyle }
  })),

  setDrawingMode: (enabled) => set({ isDrawingMode: enabled }),

  setSelectedRedactionId: (id) => set({ selectedRedactionId: id }),

  // Custom Rules
  addCustomRule: (rule) => set((state) => ({
    customRules: [...state.customRules, { id: `rule_${Date.now()}`, enabled: true, ...rule }]
  })),

  removeCustomRule: (id) => set((state) => ({
    customRules: state.customRules.filter((r) => r.id !== id)
  })),

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
