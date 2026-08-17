import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Paths that don't require authentication
const publicPaths = ['/', '/register'];
// Paths that only admins can access
const adminPaths = ['/admin', '/admin/questions'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Static files, API routes (except specifically protected ones), etc.
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path.includes('.')
    ) {
        return NextResponse.next();
    }

    const isPublicPath = publicPaths.includes(path);
    const isAdminPath = adminPaths.some(adminPath => path.startsWith(adminPath));
    
    // Get the token from cookies
    const token = request.cookies.get('auth_token')?.value;

    let payload = null;
    if (token) {
        // Verify the JWT token
        payload = await verifyToken(token);
    }

    // Redirect authenticated users trying to access login/register to their respective dashboards
    if (isPublicPath && payload) {
        if (payload.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/quiz', request.url)); // Default redirect for students
    }

    // Redirect unauthenticated users trying to access protected paths to login
    if (!isPublicPath && !payload) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based authorization for protected paths
    if (payload) {
        if (isAdminPath && payload.role !== 'admin') {
            // Student trying to access admin
            return NextResponse.redirect(new URL('/quiz', request.url));
        }
        
        if (!isAdminPath && payload.role === 'admin' && path !== '/thank-you') {
            // Admin trying to access student routes (optional constraint)
            // It's often helpful to keep them in the admin section
             return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
