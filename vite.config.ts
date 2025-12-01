import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    // Middleware для игнорирования системных запросов
    {
      name: "ignore-system-requests",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Игнорируем системные запросы от браузера
          if (
            req.url?.includes(".well-known") ||
            req.url?.includes("favicon.ico") ||
            req.url?.includes("robots.txt")
          ) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
