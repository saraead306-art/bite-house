import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  fileURLToPath,
} from 'node:url';

import {
  handleApi,
  getAdminEnv,
} from './server/api.js';


/* =========================================================
   PATHS
   ========================================================= */

const __filename =
  fileURLToPath(
    import.meta.url
  );

const ROOT =
  path.dirname(
    __filename
  );

const DIST_DIR =
  path.join(
    ROOT,
    'dist'
  );

const PUBLIC_DIR =
  path.join(
    ROOT,
    'public'
  );


/* =========================================================
   MIME TYPES
   ========================================================= */

const MIME = {
  '.html':
    'text/html; charset=utf-8',

  '.js':
    'text/javascript; charset=utf-8',

  '.css':
    'text/css; charset=utf-8',

  '.json':
    'application/json; charset=utf-8',

  '.png':
    'image/png',

  '.jpg':
    'image/jpeg',

  '.jpeg':
    'image/jpeg',

  '.webp':
    'image/webp',

  '.svg':
    'image/svg+xml',

  '.mp4':
    'video/mp4',

  '.webm':
    'video/webm',

  '.woff':
    'font/woff',

  '.woff2':
    'font/woff2',
};


/* =========================================================
   SAFE STATIC FILE
   ========================================================= */

function serveFile(
  res,
  filePath
) {
  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return false;
  }

  if (
    !fs.statSync(
      filePath
    ).isFile()
  ) {
    return false;
  }

  const extension =
    path.extname(
      filePath
    ).toLowerCase();

  res.statusCode =
    200;

  res.setHeader(
    'Content-Type',
    MIME[
      extension
    ] ||
      'application/octet-stream'
  );

  fs.createReadStream(
    filePath
  ).pipe(res);

  return true;
}


/* =========================================================
   SERVER
   ========================================================= */

const server =
  http.createServer(
    async (
      req,
      res
    ) => {
      try {
        if (
          req.url?.startsWith(
            '/api/'
          )
        ) {
          await handleApi(
            req,
            res
          );

          return;
        }

        const url =
          new URL(
            req.url ||
              '/',
            `http://${
              req.headers.host ||
              'localhost'
            }`
          );

        const requestPath =
          decodeURIComponent(
            url.pathname
          );


        /* ================================================
           UPLOADS
           ================================================ */

        if (
          requestPath.startsWith(
            '/uploads/'
          )
        ) {
          const relativePath =
            requestPath.replace(
              /^\/+/,
              ''
            );

          const uploadPath =
            path.resolve(
              PUBLIC_DIR,
              relativePath
            );

          const publicRoot =
            path.resolve(
              PUBLIC_DIR
            );

          if (
            uploadPath.startsWith(
              publicRoot
            ) &&
            serveFile(
              res,
              uploadPath
            )
          ) {
            return;
          }
        }


        /* ================================================
           DIST STATIC FILES
           ================================================ */

        const staticPath =
          path.resolve(
            DIST_DIR,
            `.${requestPath}`
          );

        const distRoot =
          path.resolve(
            DIST_DIR
          );

        if (
          staticPath.startsWith(
            distRoot
          ) &&
          serveFile(
            res,
            staticPath
          )
        ) {
          return;
        }


        /* ================================================
           SPA FALLBACK
           ================================================ */

        const indexFile =
          path.join(
            DIST_DIR,
            'index.html'
          );

        if (
          serveFile(
            res,
            indexFile
          )
        ) {
          return;
        }


        /* ================================================
           NO BUILD
           ================================================ */

        res.statusCode =
          503;

        res.setHeader(
          'Content-Type',
          'text/plain; charset=utf-8'
        );

        res.end(
          'Build the project first with npm run build.'
        );
      } catch (
        error
      ) {
        console.error(
          'Server error:',
          error
        );

        if (
          !res.headersSent
        ) {
          res.statusCode =
            500;

          res.setHeader(
            'Content-Type',
            'text/plain; charset=utf-8'
          );

          res.end(
            'Internal server error.'
          );
        }
      }
    }
  );


/* =========================================================
   START
   ========================================================= */

const port =
  Number(
    getAdminEnv().PORT
  );

server.listen(
  port,
  '0.0.0.0',
  () => {
    console.log(
      `Bite House server running on http://localhost:${port}`
    );
  }
);