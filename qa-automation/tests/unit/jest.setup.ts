import '@testing-library/jest-dom'

;(globalThis as typeof globalThis & { __API_BASE_URL__: string }).__API_BASE_URL__ = ''
