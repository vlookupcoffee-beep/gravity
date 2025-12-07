'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import StatsCard from '@/components/dashboard/StatsCard'
import { Activity, CheckCircle, Clock, Database, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const data = await getProjects()
            setProjects(data)
            setLoading(false)
        }
        load()
    }, [])

    const totalProjects = projects.length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const inProgressProjects = projects.filter(p => p.status === 'in-progress').length
    const totalValue = projects.reduce((acc, p) => acc + (p.value || 0), 0)

    // Helper for currency format
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20">
                    <Plus size={20} />
                    <span>New Project</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                    label="Total Projects"
                    value={totalProjects}
                    icon={Database}
                />
                <StatsCard
                    label="Completed"
                    value={completedProjects}
                    icon={CheckCircle}
                />
                <StatsCard
                    label="In Progress"
                    value={inProgressProjects}
                    icon={Activity}
                />
                <StatsCard
                    label="Total Value"
                    value={formatCurrency(totalValue)}
                    icon={Clock}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Project List Widget */}
                <div className="lg:col-span-2 bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white">Active Projects</h2>
                        <Link href="/dashboard/projects" className="text-blue-400 text-sm hover:underline">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {projects.slice(0, 5).map((project) => (
                            <div key={project.id} className="p-4 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition bg-[#0F172A]/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-white">{project.name}</h3>
                                        <p className="text-xs text-gray-400">{project.structures?.count || 0} structures • {(project.routeLength || 0).toFixed(2)} km</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                            project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-gray-700/50 text-gray-400'
                                        }`}>
                                        {project.status || 'Planning'}
                                    </span>
                                </div>

                                {/* Simple Progress Bar */}
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${project.progress || 0}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <p className="text-center text-gray-500 py-4">No active projects.</p>
                        )}
                    </div>
                </div>

                {/* Quick Stats / Distribution */}
                <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-bold text-white mb-6">Status Distribution</h2>
                    <div className="space-y-4">
                        {/* Visual Representation (Simple Bars) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Completed</span>
                                <span className="font-medium text-white">{completedProjects}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalProjects ? (completedProjects / totalProjects) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">In Progress</span>
                                <span className="font-medium text-white">{inProgressProjects}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalProjects ? (inProgressProjects / totalProjects) * 100 : 0}%` }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Planning</span>
                                <span className="font-medium text-white">{totalProjects - completedProjects - inProgressProjects}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${totalProjects ? ((totalProjects - completedProjects - inProgressProjects) / totalProjects) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
