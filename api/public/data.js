import { handleApi } from '../../server/api.js';

const ROUTE = '/api/public/data';

export default async function handler(req, res) {
  const requestUrl = new URL(
    req.url || ROUTE,
    'http://localhost'
  );

  if (requestUrl.pathname !== ROUTE) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'المسار غير موجود.' }));
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'الطريقة غير مسموح بها.' }));
    return;
  }

  try {
    await handleApi(req, res);
  } catch (error) {
    console.error('Vercel public data API error:', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'حدث خطأ في السيرفر.' }));
    }
  }
}
