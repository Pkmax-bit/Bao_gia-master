import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Cấu hình build dưới dạng thư viện
    lib: {
      entry: path.resolve(__dirname, 'src/embed.jsx'), // File đầu vào
      name: 'BaoGiaChatbot', // Tên global variable
      fileName: (format) => `embed.${format}.js`,
      formats: ['umd'] // Định dạng tương thích rộng rãi
    },
    outDir: 'dist-embed' // Thư mục chứa file sau khi build
  }
})