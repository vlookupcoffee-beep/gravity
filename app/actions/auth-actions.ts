'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'gravity_session'

// Sign in existing user using Custom Login Table
export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        return { error: 'Username and password are required' }
    }

    try {
        // Use RPC function for secure login (bypassing table RLS)
        const { data: users, error } = await supabase.rpc('login_user', {
            p_username: username,
            p_password: password
        })

        if (error) {
            return { error: error.message }
        }

        const user = users && users.length > 0 ? users[0] : null

        if (!user) {
            return { error: 'Invalid username or password' }
        }

        // Set Session Cookie
        const sessionData = {
            id: user.user_id,
            username: user.user_username,
            role: user.user_role
        }

        // Store session in cookie
        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        revalidatePath('/', 'layout')
        redirect('/dashboard')
    } catch (e: any) {
        if (e.message.includes('NEXT_REDIRECT')) {
            throw e;
        }
        return { error: e.message || 'Login failed' }
    }
}

// Sign out current user
export async function signOut() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)

    revalidatePath('/', 'layout')
    redirect('/login')
}

// Get current authenticated user
export async function getCurrentUser() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie || !sessionCookie.value) {
        return null
    }

    try {
        const user = JSON.parse(sessionCookie.value)
        return user
    } catch (e) {
        return null
    }
}

// Helper to check for owner role
export async function checkOwnerRole() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
        throw new Error('Unauthorized: Only owners can perform this action')
    }
}
