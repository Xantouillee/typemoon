import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site is served from a GitHub Pages project path (/<repo>/), so assets need
// that prefix in production. BASE_PATH is set by the deploy workflow; local dev
// and `vite preview` stay at the root.
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
