import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";

// vite.config.js

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/ask': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//         secure: false,
//       },

//       '/clear_memory': {
//         target: 'http://localhost:8000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//     },
//   },
// );