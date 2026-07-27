// Registers @testing-library/jest-dom matchers on Vitest's `expect` and pulls in
// their TypeScript augmentation so matchers like `toBeInTheDocument` typecheck.
import '@testing-library/jest-dom/vitest'
