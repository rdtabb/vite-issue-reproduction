import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from "@originjs/vite-plugin-federation";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
        name: "microservice",
        exposes: {
            "./app": "./src/shared/application.tsx",
        },
        shared: ["react", "react-dom"]
    })
  ],
})
