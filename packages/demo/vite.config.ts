import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { raskPlugin } from "rask-ui/plugin";

export default defineConfig({
  plugins: [tailwindcss(), raskPlugin()],
  server: {
    port: 3000,
  },
});
