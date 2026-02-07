import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const hasSession = request.cookies.has('gravity_session')
    const isLoginPath = path.startsWith('/login')

    // Root path handling
    if (path === '/') {
        if (hasSession) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Protect dashboard routes
    if (path.startsWith('/dashboard')) {
        if (!hasSession) {
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('redirectTo', path)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Redirect authenticated users away from login
    if (isLoginPath && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
