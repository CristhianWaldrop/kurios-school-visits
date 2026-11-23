import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// The default wait of one second is too tight for slow or busy machines.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
  vi.unstubAllGlobals()
})
