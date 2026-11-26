import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

const MOBILE_DEEP_LINK_PREFIXES = ['stutosed://', 'exp://', 'exps://'];

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMobileRedirectHtml(deepLink: string): string {
  const safeHref = escapeHtmlAttr(deepLink);
  const safeJsUrl = JSON.stringify(deepLink);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Returning to stutosed...</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #121110;
      color: #f5f4f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 360px;
      width: 100%;
      background: #1a1917;
      border: 1px solid #282622;
      border-radius: 18px;
      padding: 28px 22px;
      text-align: center;
    }
    h1 { font-size: 19px; margin: 0 0 8px; }
    p { font-size: 13px; color: #a6a29a; margin: 0 0 20px; line-height: 1.5; }
    a.btn {
      display: inline-block;
      background: #cc785c;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 22px;
      border-radius: 9999px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Signed in to stutosed</h1>
    <p>Redirecting you back to the mobile app. If it does not open automatically, tap the button below.</p>
    <a class="btn" href="${safeHref}">Open stutosed App</a>
  </div>
  <script>
    window.location.replace(${safeJsUrl});
  </script>
</body>
</html>`;
}

async function handleAuthRequest(method: 'GET' | 'POST', req: Request): Promise<Response> {
  const auth = await getAuth();
  const handler = toNextJsHandler(auth)[method];
  const res = await handler(req);

  const location = res.headers.get('location');
  if (
    location &&
    res.status >= 300 &&
    res.status < 400 &&
    MOBILE_DEEP_LINK_PREFIXES.some((prefix) => location.startsWith(prefix))
  ) {
    const headers = new Headers(res.headers);
    headers.delete('location');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'no-store, no-cache, must-revalidate');

    return new Response(buildMobileRedirectHtml(location), {
      status: 200,
      headers,
    });
  }

  return res;
}

export async function GET(req: Request) {
  return handleAuthRequest('GET', req);
}

export async function POST(req: Request) {
  return handleAuthRequest('POST', req);
}
