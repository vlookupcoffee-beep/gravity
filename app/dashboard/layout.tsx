import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[#0F172A] relative overflow-x-hidden">
            <DashboardSidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 print:ml-0 print:p-0 transition-all duration-300">
                {children}
            </main>
        </div>
    )
}
