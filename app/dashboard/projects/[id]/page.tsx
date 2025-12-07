'use client'

import { useEffect, useState } from 'react'
import { getProjectDetails } from '@/app/actions/get-project-details'
import { ArrowLeft, Calendar, DollarSign, Edit, Activity, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import FileList from '@/components/dashboard/FileList'
import StatsCard from '@/components/dashboard/StatsCard'
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
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0)
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${project.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-gray-700/50 text-gray-400 border-gray-600'
                            }`}>
                            {project.status || 'Planning'}
                        </span>
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition shadow-sm">
                    <Edit size={16} /> Edit Project
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Stats & Map */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatsCard label="Value" value={formatCurrency(project.value)} icon={DollarSign} />
                        <StatsCard label="Progress" value={`${project.progress || 0}%`} icon={Activity} />
                        <StatsCard label="Length" value={`${totalLength.toFixed(2)} km`} icon={MapIcon} />
                        <StatsCard label="Structures" value={totalStructures} icon={HardDrive} />
                    </div>

                    {/* Description */}
                    <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                        <h2 className="font-bold text-white mb-4">Description</h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {project.description || "No description provided."}
                        </p>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-white mb-4 text-sm uppercase text-gray-500">Route Breakdown</h3>
                            <div className="space-y-3">
                                {project.routes.map((r: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{r.name}</span>
                                        <span className="font-medium text-white">{r.length.toFixed(2)} km</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-white mb-4 text-sm uppercase text-gray-500">Structure Breakdown</h3>
                            <div className="space-y-3">
                                {Object.entries(project.structures).map(([key, val]: [string, any]) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{key}</span>
                                        <span className="font-medium text-white">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Work Items / BOQ Section (Placeholder) */}
                    <div className="bg-[#1E293B] rounded-xl border border-gray-700">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white">Work Items (BOQ)</h3>
                                <p className="text-sm text-gray-400">Manage items and track specific progress to calculate value.</p>
                            </div>
                            <button className="bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600/20 transition flex items-center gap-2">
                                <Plus size={16} /> Add Items from KHS
                            </button>
                        </div>
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                                <FileText size={24} />
                            </div>
                            <p className="text-gray-400 font-medium">No items added yet</p>
                            <p className="text-sm text-gray-500 mt-1">Import items from a Price List (KHS) to start tracking value.</p>
                        </div>
                    </div>

                    {/* Files Section */}
                    <FileList files={project.files || []} />
                </div>

                {/* Right Column: Timeline & Notes */}
                <div className="space-y-6">
                    <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                        <h2 className="font-bold text-white mb-4">Timeplan</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                    <Calendar size={16} className="text-blue-500" />
                                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">End Date</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                    <Calendar size={16} className="text-red-500" />
                                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Timeline (Mockup for Phase 1) */}
                    <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                        <h2 className="font-bold text-white mb-4">Activity Log</h2>
                        <div className="relative border-l-2 border-gray-700 ml-3 space-y-6">
                            <div className="ml-4 relative">
                                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-[#1E293B]"></div>
                                <p className="text-sm font-medium text-white">Project data updated</p>
                                <p className="text-xs text-gray-500">Just now</p>
                            </div>
                            <div className="ml-4 relative">
                                <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-gray-600 border-2 border-[#1E293B]"></div>
                                <p className="text-sm font-medium text-white">Project created</p>
                                <p className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
