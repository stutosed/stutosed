import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const isSpaTab =
    pathname.startsWith('/ece') ||
    pathname.startsWith('/gate') ||
    pathname.startsWith('/gov-exams');

  if (isSpaTab) {
    return NextResponse.rewrite(new URL('/', request.url), { request });
  }

  return NextResponse.next({ request });
}

export const updateSession = middleware;
export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, apple-icon, icon
     * - public files (thumbnails, fonts, verification HTML, robots.txt, sitemap.xml)
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-icon|icon|thumbnails|fonts|google.*\\.html|4acb2b4f.*\\.html|robots\\.txt|sitemap\\.xml).*)',
  ],
};
