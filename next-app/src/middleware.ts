import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, verifyAdminPinToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionToken = req.cookies.get('session')?.value;
  const payload = sessionToken ? await verifyJWT(sessionToken) : null;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    // /admin/access is the PIN entry gate page itself
    if (pathname !== '/admin/access') {
      const adminPinToken = req.cookies.get('admin-access-token')?.value;
      const hasValidPin = adminPinToken ? await verifyAdminPinToken(adminPinToken) : false;

      // Block PIN bypass: if pin token is missing or invalid, redirect to /admin/access
      if (!hasValidPin) {
        return NextResponse.redirect(new URL('/admin/access', req.url));
      }

      // If accessing admin dashboard or restricted admin sub-paths, require admin role
      if (pathname.startsWith('/admin/dashboard') || (!pathname.startsWith('/admin/login') && pathname !== '/admin/access')) {
        if (!payload || !['admin', 'superadmin', 'staff'].includes(payload.role)) {
          return NextResponse.redirect(new URL('/admin/access', req.url));
        }
      }
    }
  }

  // Protect /user/dashboard routes
  if (pathname.startsWith('/user/dashboard')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/user/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/dashboard/:path*'],
};
