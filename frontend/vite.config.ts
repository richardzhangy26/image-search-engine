import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    strictPort: true, // 如果端口被占用，则会抛出错误而不是尝试下一个可用端口
    open: false, // 禁用自动打开浏览器（局域网环境下可能不需要）
    cors: true, // 启用 CORS
  },
  preview: {
    host: '0.0.0.0', // 预览模式也支持局域网访问
    port: 4173,
    strictPort: true,
  },
});
