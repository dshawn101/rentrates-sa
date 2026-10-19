import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import aiHandler from './api/ai'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  process.env.VITE_SUPABASE_URL ||= env.VITE_SUPABASE_URL
  process.env.VITE_SUPABASE_ANON_KEY ||= env.VITE_SUPABASE_ANON_KEY
  return { plugins: [react(), {
    name: 'local-authenticated-ai-relay',
    configureServer(server) {
      server.middlewares.use('/api/ai', (req, res) => { void aiHandler(req, res) })
    },
  }] }
})
