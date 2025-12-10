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
        // Query the custom login table
        const { data: user, error } = await supabase
            .from('login')
            .select('*')
            .eq('username', username)
            .single()

        if (error || !user) {
            return { error: 'Invalid username or password' }
        }

        // Validate password (direct comparison for now, assuming plain text as per initial plan)
        // TODO: Implement hashing if passwords are hashed in DB
        if (user.password !== password) {
            return { error: 'Invalid username or password' }
        }

        // Set Session Cookie
        const sessionData = {
            id: user.id,
            username: user.username,
            role: user.role
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
