'use client'

import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { useState, useEffect } from 'react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Load collapse state from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved) setIsCollapsed(saved === 'true')
    }, [])

    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem('sidebar-collapsed', String(newState))
    }

    return (
        <div className="flex min-h-screen bg-[#0F172A] relative overflow-x-hidden">
            <DashboardSidebar isCollapsed={isCollapsed} onToggle={toggleCollapse} />
            <main className={`flex-1 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} p-3 md:p-6 lg:p-8 print:ml-0 print:p-0 transition-all duration-300 min-h-screen`}>
                {children}
            </main>
        </div>
    )
}
