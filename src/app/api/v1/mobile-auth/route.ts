import { NextResponse } from 'next/server';
import { withApi } from '@/server/http/withApi';
import { ok } from '@/server/http/response';
import { mobileAuthQuerySchema, MobileAuthQuery } from '@/schemas/mobile-auth.schema';
import {
  saveMobileAuthHandoff,
  consumeMobileAuthHandoff,
} from '@/server/services/mobile-auth.service';

export const dynamic = 'force-dynamic';

function extractBetterAuthSetCookie(cookieHeader: string | null): string {
  if (!cookieHeader) return '';
  const pairs = cookieHeader.split(';');
  const setCookies: string[] = [];

  for (const part of pairs) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const name = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (
      name.startsWith('better-auth.') ||
      name.startsWith('__Secure-better-auth.')
    ) {
      const isSecure = name.startsWith('__Secure-');
      setCookies.push(
        `${name}=${val}; Max-Age=604800; Path=/; HttpOnly;${isSecure ? ' Secure;' : ''} SameSite=Lax`
      );
    }
  }

  return setCookies.join(', ');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toAndroidDeepLink(rawRedirect: string | undefined, userAgent: string | null): string | null {
  if (!rawRedirect) return null;
  const trimmed = rawRedirect.trim();
  const isMobileScheme =
    trimmed.startsWith('exp://') ||
    trimmed.startsWith('exps://') ||
    trimmed.startsWith('stutosed://');
  if (!isMobileScheme) return null;

  const isAndroid = (userAgent || '').toLowerCase().includes('android');
  if (isAndroid && (trimmed.startsWith('exp://') || trimmed.startsWith('exps://'))) {
    const scheme = trimmed.startsWith('exps://') ? 'exps' : 'exp';
    const withoutScheme = trimmed.replace(/^exps?:\/\//, '');
    return `intent://${withoutScheme}#Intent;scheme=${scheme};package=host.exp.exponent;end`;
  }

  return trimmed;
}

function renderBridgeHtml(opts: {
  title: string;
  subtitle: string;
  deepLink: string | null;
  rawRedirect: string | null;
  success: boolean;
}): string {
  const safeTitle = escapeHtml(opts.title);
  const safeSub = escapeHtml(opts.subtitle);
  const targetUrl = opts.deepLink || opts.rawRedirect || '';
  const safeHref = escapeHtml(targetUrl);
  const safeJsUrl = JSON.stringify(targetUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
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
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 14px;
      background: ${opts.success ? 'rgba(74, 222, 128, 0.14)' : 'rgba(248, 113, 113, 0.14)'};
      color: ${opts.success ? '#4ade80' : '#f87171'};
    }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { font-size: 13px; color: #a6a29a; margin: 0 0 20px; line-height: 1.55; }
    a.btn {
      display: inline-block;
      background: #cc785c;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 9999px;
      margin-bottom: 14px;
    }
    .hint {
      font-size: 12px;
      color: #736f67;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${opts.success ? 'Authentication Complete' : 'Authentication Pending'}</div>
    <h1>${safeTitle}</h1>
    <p>${safeSub}</p>
    ${targetUrl ? `<a class="btn" href="${safeHref}">Open stutosed App</a>` : ''}
    <div class="hint">You can also tap the <strong>✕</strong> button at the top-left to return to the app — your sign-in is already synced.</div>
  </div>
  ${targetUrl ? `<script>setTimeout(function(){ window.location.href = ${safeJsUrl}; }, 250);</script>` : ''}
</body>
</html>`;
}

export const GET = withApi<unknown, MobileAuthQuery>(
  async ({ req, query, user }) => {
    const { action, token, redirect } = query;

    if (action === 'poll') {
      const handoff = await consumeMobileAuthHandoff(token);
      if (!handoff) {
        return ok({ status: 'pending' });
      }
      return ok({
        status: 'ready',
        setCookie: handoff.setCookie,
        user: handoff.user,
      });
    }

    // action === 'complete'
    const cookieHeader = req.headers.get('cookie');
    const setCookie = extractBetterAuthSetCookie(cookieHeader);

    if (!user || !setCookie) {
      const html = renderBridgeHtml({
        title: 'Session Not Found',
        subtitle: 'Please return to the app and try signing in again.',
        deepLink: null,
        rawRedirect: null,
        success: false,
      });
      return new NextResponse(html, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    }

    await saveMobileAuthHandoff(token, {
      setCookie,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });

    const deepLink = toAndroidDeepLink(redirect, req.headers.get('user-agent'));
    const rawRedirect =
      redirect &&
      (redirect.startsWith('exp://') ||
        redirect.startsWith('exps://') ||
        redirect.startsWith('stutosed://'))
        ? redirect
        : null;

    const html = renderBridgeHtml({
      title: `Welcome, ${user.name || 'Student'}!`,
      subtitle: 'Your Google account is signed in. Returning to stutosed...',
      deepLink,
      rawRedirect,
      success: true,
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  },
  {
    querySchema: mobileAuthQuerySchema,
    requireAuth: false,
    rateLimit: { limit: 120, windowSeconds: 60 },
  }
);
