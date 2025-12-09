import { updateSession } from '@/utils/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    // Update session
    const response = await updateSession(request)

    // Get pathname
    const path = request.nextUrl.pathname

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.some(p => path.startsWith(p))

    // Root path - check auth and redirect accordingly
    if (path === '/') {
        // Let the page component handle the redirect based on auth
        return response
    }

    // If trying to access dashboard without auth, redirect to login
    if (path.startsWith('/dashboard')) {
        // Check if user is authenticated
        const supabase = response.cookies.getAll()
        const hasSession = supabase.some(cookie =>
            cookie.name.includes('auth-token') || cookie.name.includes('sb-')
        )

        if (!hasSession) {
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('redirectTo', path)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // If authenticated and trying to access login/register, redirect to dashboard
    if (isPublicPath) {
        const supabase = response.cookies.getAll()
        const hasSession = supabase.some(cookie =>
            cookie.name.includes('auth-token') || cookie.name.includes('sb-')
        )

        if (hasSession && (path === '/login' || path === '/register')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
