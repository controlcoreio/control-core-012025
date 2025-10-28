
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react()];


  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      hmr: {
        port: 5173
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // define: {
    //   __WS_TOKEN__: JSON.stringify(process.env.WS_TOKEN || '')
    // }
  };
});
