'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import { getAllPowTasks } from '@/app/actions/pow-actions'
import StatsCard from '@/components/dashboard/StatsCard'
import { Activity, CheckCircle, Clock, Database, Plus, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [powTasks, setPowTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const [projectsData, powData] = await Promise.all([
                getProjects(),
                getAllPowTasks()
            ])
            setProjects(projectsData)
            setPowTasks(powData)
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
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
                </div>
                <Link
                    href="/dashboard/projects/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} />
                    <span>New Project</span>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    className="sm:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#1E293B] to-[#0F172A]"
                />
            </div>

            {/* PoW Table Widget */}
            <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Plan of Work Overview</h2>
                    <Link href="/dashboard/projects" className="text-blue-400 text-sm hover:underline">View All Projects</Link>
                </div>

                {projects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No projects available.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#0F172A] text-gray-400 font-medium border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-[#0F172A] z-10">No</th>
                                    <th className="px-4 py-3 sticky left-12 bg-[#0F172A] z-10 min-w-[200px]">Project Name</th>
                                    <th className="px-4 py-3 text-center border-l border-gray-700" colSpan={3}>1. PREPARING</th>
                                    <th className="px-4 py-3 text-center border-l border-gray-700" colSpan={4}>2. MATERIAL DELIVERY</th>
                                    <th className="px-4 py-3 text-center border-l border-gray-700" colSpan={6}>3. INSTALASI & COMMISSIONING TEST</th>
                                    <th className="px-4 py-3 text-center border-l border-gray-700">4. CLOSING</th>
                                </tr>
                                <tr className="text-xs">
                                    <th className="px-4 py-2 sticky left-0 bg-[#0F172A] z-10"></th>
                                    <th className="px-4 py-2 sticky left-12 bg-[#0F172A] z-10"></th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">1.2 KOM</th>
                                    <th className="px-2 py-2 text-center">1.3 Survey</th>
                                    <th className="px-2 py-2 text-center">1.4 DRM</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">2.1 Fabrikasi</th>
                                    <th className="px-2 py-2 text-center">2.2 HDPE</th>
                                    <th className="px-2 py-2 text-center">2.3 Kabel</th>
                                    <th className="px-2 py-2 text-center">2.4 Tiang</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">3.1 Ijin</th>
                                    <th className="px-2 py-2 text-center">3.2 HDPE</th>
                                    <th className="px-2 py-2 text-center">3.3 Tiang</th>
                                    <th className="px-2 py-2 text-center">3.4 Kabel</th>
                                    <th className="px-2 py-2 text-center">3.5 Joint</th>
                                    <th className="px-2 py-2 text-center">3.6 Test</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">4.1 ATP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {projects.map((project, index) => {
                                    // Get tasks for this project
                                    const projectTasks = powTasks.filter((t: any) => t.projects?.id === project.id)

                                    // Helper to get task status icon
                                    const getTaskIcon = (taskName: string) => {
                                        const task = projectTasks.find((t: any) => t.task_name.includes(taskName))
                                        if (!task) return <span className="text-gray-600">-</span>

                                        if (task.status === 'completed') return <CheckCircle2 className="text-green-400 mx-auto" size={16} />
                                        if (task.status === 'in-progress') return <TrendingUp className="text-blue-400 mx-auto" size={16} />
                                        if (task.status === 'delayed') return <AlertCircle className="text-red-400 mx-auto" size={16} />
                                        return <Clock className="text-gray-400 mx-auto" size={16} />
                                    }

                                    return (
                                        <tr key={project.id} className="hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-gray-400 sticky left-0 bg-[#1E293B] z-10">{index + 1}</td>
                                            <td className="px-4 py-3 sticky left-12 bg-[#1E293B] z-10">
                                                <Link href={`/dashboard/projects/${project.id}`} className="text-white hover:text-blue-400 font-medium">
                                                    {project.name}
                                                </Link>
                                            </td>
                                            {/* PREPARING */}
                                            <td className="px-2 py-3 text-center border-l border-gray-700/50">{getTaskIcon('1.2')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('1.3')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('1.4')}</td>
                                            {/* MATERIAL DELIVERY */}
                                            <td className="px-2 py-3 text-center border-l border-gray-700/50">{getTaskIcon('2.1')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('2.2')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('2.3')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('2.4')}</td>
                                            {/* INSTALASI & COMMISSIONING */}
                                            <td className="px-2 py-3 text-center border-l border-gray-700/50">{getTaskIcon('3.1')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('3.2')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('3.3')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('3.4')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('3.5')}</td>
                                            <td className="px-2 py-3 text-center">{getTaskIcon('3.6')}</td>
                                            {/* CLOSING */}
                                            <td className="px-2 py-3 text-center border-l border-gray-700/50">{getTaskIcon('4.1')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    )
}
