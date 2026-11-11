import { defineConfig, loadEnv } from 'vite'
import {resolve} from 'node:path'
import react from '@vitejs/plugin-react'
import aiHandler from './api/ai'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  process.env.VITE_SUPABASE_URL ||= env.VITE_SUPABASE_URL
  process.env.VITE_SUPABASE_ANON_KEY ||= env.VITE_SUPABASE_ANON_KEY
  return {build:{rollupOptions:{input:{app:resolve(process.cwd(),'index.html'),seriesBible:resolve(process.cwd(),'tools/series-bible.html')}}},server:{hmr:mode==='series-bible'?false:undefined},plugins: [...(mode==='series-bible'?[]:[react()]), {
    name: 'local-authenticated-ai-relay',
    configureServer(server) {
      server.middlewares.use((req,_res,next)=>{if(/^\/series-bible(?:\/|$)/.test(req.url?.split('?')[0]||'')||req.url?.split('?')[0]==='/tools/series-bible')req.url='/tools/series-bible.html';next();})
      server.middlewares.use('/api/ai', (req, res) => { void aiHandler(req, res) })
    },
  }] }
})
