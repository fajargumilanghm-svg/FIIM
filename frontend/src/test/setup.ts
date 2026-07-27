// Registers @testing-library/jest-dom matchers on Vitest's `expect` and pulls in
// their TypeScript augmentation so matchers like `toBeInTheDocument` typecheck.
import '@testing-library/jest-dom/vitest'

// Recharts' ResponsiveContainer relies on ResizeObserver, which jsdom lacks.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
}

// jsdom does not enable Web Storage without an origin; provide a simple
// in-memory localStorage so store/service code under test can run.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const localStorageMock: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key) as unknown as void,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  }
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
}
