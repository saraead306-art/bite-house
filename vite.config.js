import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import {
  handleApi,
} from './server/api.js';

export default defineConfig({
  plugins: [
    react(),

    {
      name: 'bite-house-api',

      configureServer(server) {
        server.middlewares.use(
          async (
            req,
            res,
            next
          ) => {
            try {
              const handled =
                await handleApi(
                  req,
                  res
                );

              if (!handled) {
                next();
              }
            } catch (error) {
              console.error(
                'API Error:',
                error
              );

              if (
                !res.headersSent
              ) {
                res.statusCode =
                  500;

                res.setHeader(
                  'Content-Type',
                  'application/json; charset=utf-8'
                );

                res.end(
                  JSON.stringify({
                    message:
                      'حدث خطأ في السيرفر.',
                  })
                );
              }
            }
          }
        );
      },
    },
  ],

server: {
  host: '0.0.0.0',
  port: Number(process.env.PORT || 5173),
  strictPort: false,
},

preview: {
  host: '0.0.0.0',
  port: Number(process.env.PORT || 5173),
},

  build: {
    sourcemap: false,

    chunkSizeWarningLimit: 1000,
  },
});