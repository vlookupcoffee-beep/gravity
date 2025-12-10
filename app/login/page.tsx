'use client'

import { useState } from 'react'
import { signIn } from '@/app/actions/auth-actions'
import { LogIn, User, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await signIn(formData)
            if (result?.error) {
                setError(result.error)
            }
        } catch (err: any) {
            if (err.message.includes('NEXT_REDIRECT')) {
                throw err;
            }
            setError(err.message || 'An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B1120] via-[#1E293B] to-[#0F172A] p-4">
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Gravity</h1>
                    <p className="text-gray-400">Project Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <LogIn className="text-blue-400" size={28} />
                            Sign In
                        </h2>
                        <p className="text-gray-400 mt-1">Welcome back! Please login to continue.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-red-400 text-sm">{error}</div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-[#0F172A] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-700 bg-[#0F172A] text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-400">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition">
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>&copy; 2024 Gravity. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
