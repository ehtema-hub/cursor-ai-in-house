import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __API_BASE_URL__: JSON.stringify(process.env.VITE_API_URL ?? ''),
    __BLOG_API_BASE_URL__: JSON.stringify(process.env.VITE_BLOG_API_URL ?? '/blog-api'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/blog-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/blog-api/, ''),
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/blog-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/blog-api/, ''),
      },
    },
  },
})
