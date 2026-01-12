'use client'

import Link from 'next/link'
import { LayoutDashboard, FolderKanban, Map as MapIcon, Settings, Receipt, LogOut, User, Package, Menu, X } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        async function loadUser() {
            const { getCurrentUser } = await import('@/app/actions/auth-actions')
            const userData = await getCurrentUser()
            setUser(userData)
        }
        loadUser()
    }, [])

    // Close menu on route change (mobile)
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

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

    const menuItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/projects', label: 'Daftar Proyek', icon: FolderKanban },
        { href: '/dashboard/khs', label: 'Daftar Harga (KHS)', icon: Receipt },
        { href: '/dashboard/materials', label: 'Material', icon: Package },
        { href: '/dashboard/map', label: 'Peta Geospasial', icon: MapIcon },
    ]

    // Only show Finance for owner
    if (user?.role === 'owner') {
        const financeItem = { href: '/dashboard/finance', label: 'Keuangan', icon: Receipt };
        // Insert after Daftar Proyek (index 1)
        menuItems.splice(2, 0, financeItem);
    }

    return (
        <>
            {/* Mobile Hamburger Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 bg-[#1E293B] border border-gray-700/50 rounded-xl text-white shadow-xl backdrop-blur-md active:scale-95 transition-all"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed top-0 bottom-0 left-0 w-64 bg-[#0B1120] border-r border-gray-800 flex flex-col h-full z-[45] print:hidden
                transition-transform duration-300 ease-in-out lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-gray-800">
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-lg font-bold text-white tracking-widest">NAKA</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase text-center mt-1">
                            Network Protocol
                        </p>
                    </div>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.href)
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                : 'text-gray-500 hover:bg-gray-800/50 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={isActive(item.href) ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800 space-y-4">
                    {/* User Profile */}
                    {user && (
                        <div className="px-4 py-3 bg-gray-800/30 rounded-2xl border border-gray-700/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                                    <User size={18} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-white truncate uppercase tracking-tighter">
                                        {user.full_name || 'Admin Protokol'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate font-bold">{user.username}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 text-gray-500 rounded-xl hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200 font-bold text-sm"
                    >
                        <LogOut size={20} />
                        <span>Keluar Sesi</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
