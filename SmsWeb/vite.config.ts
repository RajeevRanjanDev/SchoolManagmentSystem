import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Set VITE_TUNNEL_HOST to your ngrok host (e.g. "abc123.ngrok-free.app") when
// serving through a tunnel, so HMR connects back over wss. Leave unset for local.
const tunnelHost = process.env.VITE_TUNNEL_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,              // listen on all interfaces so a tunnel can reach it
    allowedHosts: true,      // accept any Host header (dev tunnels like ngrok)
    // When tunnelled, point HMR at the public host over wss; otherwise default.
    hmr: tunnelHost ? { host: tunnelHost, protocol: 'wss', clientPort: 443 } : undefined,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        ws: true,
      },
    },
  },
});
