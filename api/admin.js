import { handleApi } from '../server/api.js';

const FUNCTION_PATH = '/api/admin';

export default async function handler(req, res) {
  const incoming = new URL(req.url || FUNCTION_PATH, 'http://localhost');
  const originalPath = incoming.searchParams.get('__originalPath') || incoming.pathname;

  // The rewrite marker is internal routing metadata, not part of the API request.
  if (originalPath !== FUNCTION_PATH && !originalPath.startsWith(`${FUNCTION_PATH}/`)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'المسار غير موجود.' }));
    return;
  }

  const query = new URLSearchParams(incoming.searchParams);
  query.delete('__originalPath');
  req.url = `${originalPath}${query.size ? `?${query.toString()}` : ''}`;

  try {
    await handleApi(req, res);
  } catch (error) {
    console.error('Vercel admin API error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'حدث خطأ في السيرفر.' }));
    }
  }
}
