'use client'

import Link from 'next/link'
import { LayoutDashboard, FolderKanban, Map as MapIcon, Settings, Receipt } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function DashboardSidebar() {
    const pathname = usePathname()

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
                    <div className="relative w-8 h-8">
                        <Image
                            src="/Logo.png"
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

            <div className="p-4 border-t border-gray-800">
                <button className="flex items-center gap-3 px-3 py-2 text-gray-400 rounded-lg hover:bg-gray-800 w-full transition">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </aside>
    )
}
