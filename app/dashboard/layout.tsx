import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[#0F172A]">
            <DashboardSidebar />
            <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
                {children}
            </main>
        </div>
    )
}
