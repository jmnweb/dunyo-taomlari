import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite konfiguratsiyasi. Frontend backendga to'g'ridan-to'g'ri
// (http://localhost:5000) axios orqali murojaat qiladi, shuning uchun
// bu yerda proxy sozlash shart emas.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
