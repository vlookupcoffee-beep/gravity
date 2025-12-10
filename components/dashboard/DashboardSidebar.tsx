'use client'

import Link from 'next/link'
import { LayoutDashboard, FolderKanban, Map as MapIcon, Settings, Receipt, LogOut, User } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        async function loadUser() {
            const { getCurrentUser } = await import('@/app/actions/auth-actions')
            const userData = await getCurrentUser()
            setUser(userData)
        }
        loadUser()
    }, [])

    async function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            const { signOut } = await import('@/app/actions/auth-actions')
            await signOut()
        }
    }

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(path)
    }

    return (
        <aside className="w-64 bg-[#0B1120] border-r border-gray-800 flex flex-col h-full fixed left-0 top-0 bottom-0 z-10">
            <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center">
                        <Image
                            src="/gravity-logo.png"
                            alt="Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="text-lg font-bold text-white">My Database</span>
                </div>
            </div>

            <nav className="p-4 space-y-1 flex-1">
                <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/dashboard')
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </Link>
                <Link
                    href="/dashboard/projects"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/dashboard/projects')
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <FolderKanban size={20} />
                    <span className="font-medium">Projects</span>
                </Link>
                <Link
                    href="/dashboard/khs"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/dashboard/khs')
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <Receipt size={20} />
                    <span className="font-medium">Price Lists (KHS)</span>
                </Link>
                <Link
                    href="/dashboard/map"
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive('/dashboard/map')
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                >
                    <MapIcon size={20} />
                    <span className="font-medium">Map View</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-gray-800 space-y-3">
                {/* User Profile */}
                {user && (
                    <div className="px-3 py-2 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                                <User size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user.full_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 w-full transition"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    )
}
