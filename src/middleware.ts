import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Check for session cookie
    const session = request.cookies.get('session')?.value;

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // 3. Decrypt and verify session
        const payload = await decrypt(session);
        
        if (!payload || (payload.expires && new Date(payload.expires) < new Date())) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('session');
            response.cookies.delete('admin_session');
            return response;
        }

        // 4. Admin route protection
        if (pathname.startsWith('/admin')) {
            if (payload.role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware auth error:', error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        response.cookies.delete('admin_session');
        return response;
    }
}

export const config = {
    // Match all routes except static files, images, etc.
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
