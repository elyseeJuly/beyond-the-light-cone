import '@testing-library/jest-dom';

// Simple in-memory localStorage implementation for testing
const memoryStorage: Record<string, string> = {};

// Mock browser APIs for headless testing
(globalThis as any).window = globalThis.window || {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class { 
    type: string; 
    detail: any; 
    constructor(t: string, o?: any) { 
      this.type = t; 
      this.detail = o?.detail; 
    } 
  },
  localStorage: { 
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, value: string) => { memoryStorage[key] = value; },
    removeItem: (key: string) => { delete memoryStorage[key]; },
    clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
  },
};
