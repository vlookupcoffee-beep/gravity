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
import { HardDrive, Map as MapIcon } from 'lucide-react'

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

    useEffect(() => {
        if (params.id) {
            loadProject(params.id as string)
        }
    }, [params.id])

    async function loadProject(id: string) {
        setLoading(true)
        const data = await getProjectDetails(id)
        setProject(data)
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/projects" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <select
                            value={project.status || 'planning'}
                            onChange={async (e) => {
                                const newStatus = e.target.value
                                // Optimistic update
                                setProject({ ...project, status: newStatus })

                                // Call server action
                                const { updateProjectStatus } = await import('@/app/actions/project-actions')
                                await updateProjectStatus(project.id, newStatus)
                            }}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#1E293B] ${project.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20 focus:ring-green-500' :
                                project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 focus:ring-blue-500' :
                                    'bg-gray-700/50 text-gray-400 border-gray-600 focus:ring-gray-500'
                                }`}
                        >
                            <option value="planning" className="bg-[#1E293B] text-gray-400">Planning</option>
                            <option value="in-progress" className="bg-[#1E293B] text-blue-400">In Progress</option>
                            <option value="completed" className="bg-[#1E293B] text-green-400">Completed</option>
                        </select>
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition shadow-sm"
                >
                    <Edit size={16} /> Edit Project
                </button>
            </div>

            {/* Top Row: Stats (Full Width) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    label="Value"
                    value={formatCurrency(project.value)}
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
                    <ProjectBOQ projectId={project.id} onUpdate={() => loadProject(project.id)} />
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
                        <h2 className="font-bold text-white mb-4">Activity Log</h2>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-10 before:bottom-0 before:w-0.5 before:bg-gray-700">
                            {/* Mock Activity - In real app, fetch from logs */}
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#1E293B]"></div>
                                <p className="text-sm font-medium text-white">Project data updated</p>
                                <p className="text-xs text-gray-500">Just now</p>
                            </div>
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-gray-600 border-4 border-[#1E293B]"></div>
                                <p className="text-sm font-medium text-white">Project created</p>
                                <p className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
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
        </div>
    )
}
