import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 는 https://<user>.github.io/cosplay/ 로 서빙되므로 base 가 필요하다.
// 다른 곳에 올릴 때는 BASE_PATH 환경변수로 덮어쓸 수 있다.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/cosplay/',
  plugins: [react(), tailwindcss()],
});
