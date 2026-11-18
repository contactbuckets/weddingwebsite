import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
 base: process.env.GITHUB_PAGES === 'true' ? '/weddingwebsite/' : '/',
 plugins: [react()],
 resolve: { alias: { '@': fileURLToPath(new URL('./src/templates/muslim-original/src', import.meta.url)) } }
})