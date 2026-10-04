// Vercel serverless entry: every /api/* request is handled by the Express app.
// The app is imported lazily so a startup failure is reported as a readable error
// instead of Vercel's generic FUNCTION_INVOCATION_FAILED page.
let appPromise;

export default async function handler(req, res) {
  try {
    appPromise ||= import('../server/index.js').then((m) => m.default);
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    appPromise = undefined; // allow a retry on the next request
    console.error('Startup failure:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server failed to start', detail: `${err?.name}: ${err?.message}`.slice(0, 300) }));
  }
}
