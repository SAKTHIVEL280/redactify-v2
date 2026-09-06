import { create } from 'zustand';

export const useDocumentStore = create((set) => ({
  file: null,
  fileName: '',
  fileSize: 0,
  fileType: null, // 'pdf' | 'docx' | 'image' | 'text'
  rawText: '',
  pageCount: 1,
  currentPage: 1,
  isProcessing: false,
  progress: { current: 0, total: 0, message: '' },
  error: null,
  rotation: 0, // 0 | 90 | 180 | 270 degrees

  setFile: (file, fileType) => set({
    file,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    currentPage: 1,
    rotation: 0,
    error: null
  }),

  setDocumentData: (data) => set((state) => ({ ...state, ...data })),

  setProgress: (current, total, message = '') => set({
    progress: { current, total, message },
    isProcessing: current < total
  }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setRotation: (rotation) => set({ rotation: ((rotation % 360) + 360) % 360 }),
  rotateClockwise: () => set((state) => ({ rotation: (state.rotation + 90) % 360 })),
  rotateCounterClockwise: () => set((state) => ({ rotation: (state.rotation + 270) % 360 })),

  setError: (error) => set({ error, isProcessing: false }),

  clearDocument: () => set({
    file: null,
    fileName: '',
    fileSize: 0,
    fileType: null,
    rawText: '',
    pageCount: 1,
    currentPage: 1,
    rotation: 0,
    isProcessing: false,
    progress: { current: 0, total: 0, message: '' },
    error: null
  })
}));
