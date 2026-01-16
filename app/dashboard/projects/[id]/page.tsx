'use client'

import { useEffect, useState } from 'react'
import { getProjectDetails } from '@/app/actions/get-project-details'
import { ArrowLeft, Calendar, DollarSign, Edit, Activity, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import FileList from '@/components/dashboard/FileList'
import StatsCard from '@/components/dashboard/StatsCard'
import ProjectBOQ from '@/components/dashboard/ProjectBOQ'
import ProjectPoW from '@/components/dashboard/ProjectPoW'
import EditProjectModal from '@/components/dashboard/EditProjectModal'
import DailyReportHistory from '@/components/dashboard/DailyReportHistory'
import ProjectReportModal from '@/components/dashboard/ProjectReportModal'
import { HardDrive, Map as MapIcon, FileBarChart } from 'lucide-react'
import { getCurrentUser } from '@/app/actions/auth-actions'

// Reuse map component dynamically
import dynamic from 'next/dynamic'
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-800 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Map...</div>
})

export default function ProjectDetailPage() {
    const params = useParams()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        if (params.id) {
            loadProject(params.id as string)
        }
    }, [params.id])

    async function loadProject(id: string) {
        setLoading(true)
        const [data, user] = await Promise.all([
            getProjectDetails(id),
            getCurrentUser()
        ])
        setProject(data)
        setUserRole(user?.role || null)
        setLoading(false)
    }

    if (loading) return <div className="p-8 text-center text-white">Loading project details...</div>
    if (!project) return <div className="p-8 text-center text-white">Project not found</div>

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
    }

    const totalLength = project.routes.reduce((acc: number, r: any) => acc + r.length, 0)
    const totalStructures = Object.values(project.structures).reduce((a: any, b: any) => a + b, 0) as number

    return (
        <>
            <div className="space-y-6 print:hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 bg-[#1E293B]/40 p-4 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link href="/dashboard/projects" className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all bg-[#0F172A]/50 border border-gray-700/50">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black text-white truncate tracking-tight">{project.name}</h1>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                                <span className={`px-2 py-0.5 rounded-md border ${project.status?.toLowerCase().includes('done') || project.status?.toLowerCase().includes('atp') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        project.status?.toLowerCase().includes('kick off') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            project.status?.toLowerCase().includes('survey') ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {project.status || 'Perencanaan'}
                                </span>
                                <span className="hidden xs:inline">•</span>
                                <span className="hidden xs:inline">Created {new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                        <button
                            onClick={() => setShowReport(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 active:scale-95 border border-blue-400/20"
                        >
                            <FileBarChart size={16} /> Laporan
                        </button>
                        {userRole !== 'mandor' && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E293B] border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all font-bold text-xs active:scale-95"
                            >
                                <Edit size={16} /> Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Top Row: Stats (Full Width) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard
                        label={userRole === 'mandor' ? "Item Value" : "Project Value"}
                        value={formatCurrency(userRole === 'mandor' ? project.value_mandor : project.value)}
                        icon={DollarSign}
                        className="sm:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#1E293B] to-[#0F172A]"
                    />
                    <StatsCard label="Progress" value={`${project.progress || 0}%`} icon={Activity} />
                    <StatsCard label="Length" value={`${totalLength.toFixed(2)} km`} icon={MapIcon} />
                    <StatsCard label="Structures" value={totalStructures} icon={HardDrive} />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                            <h2 className="font-bold text-white mb-4">Description</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {project.description || "No description provided."}
                            </p>
                        </div>

                        {/* Plan of Work Section */}
                        <ProjectPoW projectId={project.id} onUpdate={() => loadProject(project.id)} />

                        {/* Work Items / BOQ Section */}
                        <ProjectBOQ projectId={project.id} onUpdate={() => loadProject(project.id)} userRole={userRole} />

                        {/* Telegram Daily Reports History */}
                        <DailyReportHistory projectId={project.id} />
                    </div>


                    {/* Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Timeplan - Aligned with Description */}
                        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                            <h2 className="font-bold text-white mb-4">Timeplan</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">End Date</label>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Calendar size={16} className="text-red-500" />
                                        <span>{project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                            <h2 className="font-bold text-white mb-4">Project Status</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-gray-700">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <span className={`text-xs font-bold uppercase ${project.status === 'completed' ? 'text-green-400' :
                                        project.status === 'in-progress' ? 'text-blue-400' :
                                            'text-gray-400'
                                        }`}>{project.status || 'Planning'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded-lg border border-gray-700">
                                    <span className="text-sm text-gray-500">Last Update</span>
                                    <span className="text-xs text-white">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {isEditModalOpen && (
                <EditProjectModal
                    project={project}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={() => loadProject(project.id)}
                />
            )}

            {showReport && (
                <ProjectReportModal
                    mode="single"
                    data={project}
                    onClose={() => setShowReport(false)}
                />
            )}
        </>
    )
}
