import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest does not expose a global afterEach, so Testing Library cannot
// register its own cleanup. Unmount after every test to keep the DOM isolated.
afterEach(() => {
  cleanup()
})
