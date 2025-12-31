'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import { getAllPowTasks } from '@/app/actions/pow-actions'
import { renameProject } from '@/app/actions/project-actions'
import StatsCard from '@/components/dashboard/StatsCard'
import { Activity, CheckCircle, Clock, Database, Plus, TrendingUp, CheckCircle2, AlertCircle, Pencil } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [powTasks, setPowTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [isRenaming, setIsRenaming] = useState(false)

    const load = async () => {
        setLoading(true)
        const [projectsData, powData] = await Promise.all([
            getProjects(),
            getAllPowTasks()
        ])
        setProjects(projectsData)
        setPowTasks(powData)
        setLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    const handleRename = async () => {
        if (!renamingId || !newName.trim()) return

        setIsRenaming(true)
        const result = await renameProject(renamingId, newName)
        if (result.success) {
            setRenamingId(null)
            setNewName('')
            load()
        } else {
            alert('Failed to rename project: ' + result.error)
        }
        setIsRenaming(false)
    }

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
                <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white">Plan of Work Overview</h2>
                        <Link href="/dashboard/projects" className="text-blue-400 text-sm hover:underline">View All Projects</Link>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase()
                                const rows = document.querySelectorAll('[data-project-row]')
                                rows.forEach((row: any) => {
                                    const projectName = row.getAttribute('data-project-name').toLowerCase()
                                    row.style.display = projectName.includes(searchTerm) ? '' : 'none'
                                })
                            }}
                        />
                        <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No projects available.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#0F172A] text-gray-400 font-medium border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 sticky left-0 bg-[#0F172A] z-10 border-r border-gray-700">No</th>
                                    <th className="px-4 py-3 sticky left-12 bg-[#0F172A] z-10 min-w-[220px] border-r border-gray-700">Project Name</th>
                                    <th className="px-4 py-3 sticky left-[280px] bg-[#0F172A] z-10 text-center border-r border-gray-700">Progress</th>
                                    <th className="px-4 py-3 text-center bg-blue-900/20 border-l border-gray-700" colSpan={3}>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            1. PREPARING
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center bg-purple-900/20 border-l border-gray-700" colSpan={4}>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                            2. MATERIAL DELIVERY
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center bg-orange-900/20 border-l border-gray-700" colSpan={6}>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                            3. INSTALASI & COMMISSIONING
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center bg-green-900/20 border-l border-gray-700">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            4. CLOSING
                                        </div>
                                    </th>
                                </tr>
                                <tr className="text-xs bg-[#0F172A]/50">
                                    <th className="px-4 py-2 sticky left-0 bg-[#0F172A]/50 z-10 border-r border-gray-700"></th>
                                    <th className="px-4 py-2 sticky left-12 bg-[#0F172A]/50 z-10 border-r border-gray-700"></th>
                                    <th className="px-4 py-2 sticky left-[280px] bg-[#0F172A]/50 z-10 border-r border-gray-700"></th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">KOM</th>
                                    <th className="px-2 py-2 text-center">Survey</th>
                                    <th className="px-2 py-2 text-center">DRM</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">Fabrikasi</th>
                                    <th className="px-2 py-2 text-center">HDPE</th>
                                    <th className="px-2 py-2 text-center">Kabel</th>
                                    <th className="px-2 py-2 text-center">Tiang</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">Ijin</th>
                                    <th className="px-2 py-2 text-center">HDPE</th>
                                    <th className="px-2 py-2 text-center">Tiang</th>
                                    <th className="px-2 py-2 text-center">Kabel</th>
                                    <th className="px-2 py-2 text-center">Joint</th>
                                    <th className="px-2 py-2 text-center">Test</th>
                                    <th className="px-2 py-2 text-center border-l border-gray-700/50">ATP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {projects.map((project, index) => {
                                    // Get tasks for this project
                                    const projectTasks = powTasks.filter((t: any) => t.projects?.id === project.id)

                                    // Calculate overall progress from average of task progress
                                    const totalProgress = projectTasks.reduce((acc: number, t: any) => acc + (t.progress || 0), 0)
                                    const overallProgress = projectTasks.length > 0 ? Math.round(totalProgress / projectTasks.length) : 0

                                    // Helper to get task status icon
                                    const getTaskIcon = (taskName: string) => {
                                        const task = projectTasks.find((t: any) => t.task_name.includes(taskName))
                                        if (!task) return <span className="text-gray-600">-</span>

                                        const icon = (() => {
                                            if (task.status === 'completed') return <CheckCircle2 className="text-green-400 mx-auto" size={16} />
                                            if (task.status === 'in-progress') return <TrendingUp className="text-blue-400 mx-auto" size={16} />
                                            if (task.status === 'delayed') return <AlertCircle className="text-red-400 mx-auto" size={16} />
                                            return <Clock className="text-gray-400 mx-auto" size={16} />
                                        })()

                                        return (
                                            <div className="relative group flex justify-center items-center cursor-help">
                                                {icon}
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 min-w-[200px] p-3 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg shadow-xl text-left">
                                                    <div className="font-semibold text-white text-xs mb-1">{task.task_name}</div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-gray-300">
                                                            <span>Status:</span>
                                                            <span className={
                                                                task.status === 'completed' ? 'text-green-400' :
                                                                    task.status === 'in-progress' ? 'text-blue-400' :
                                                                        task.status === 'delayed' ? 'text-red-400' : 'text-gray-400'
                                                            }>{task.status.replace('-', ' ')}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-300">
                                                            <span>Progress:</span>
                                                            <span className="text-white font-medium">{task.progress || 0}%</span>
                                                        </div>
                                                        {task.description && (
                                                            <div className="pt-2 mt-1 border-t border-gray-700 text-[10px] text-gray-400 italic">
                                                                "{task.description}"
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Arrow */}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <tr
                                            key={project.id}
                                            className="hover:bg-gray-800/50 transition"
                                            data-project-row
                                            data-project-name={project.name}
                                        >
                                            <td className="px-4 py-3 text-gray-400 sticky left-0 bg-[#1E293B] z-10 border-r border-gray-700/50">{index + 1}</td>
                                            <td className="px-4 py-3 sticky left-12 bg-[#1E293B] z-10 border-r border-gray-700/50">
                                                <div className="flex items-center justify-between group/row">
                                                    <Link href={`/dashboard/projects/${project.id}`} className="text-white hover:text-blue-400 font-medium block truncate pr-2">
                                                        {project.name}
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setRenamingId(project.id)
                                                            setNewName(project.name)
                                                        }}
                                                        className="opacity-0 group-hover/row:opacity-100 text-gray-500 hover:text-blue-400 transition p-1"
                                                        title="Rename Project"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 sticky left-[280px] bg-[#1E293B] z-10 border-r border-gray-700/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${overallProgress === 100 ? 'bg-green-500' :
                                                                overallProgress >= 50 ? 'bg-blue-500' :
                                                                    overallProgress > 0 ? 'bg-yellow-500' : 'bg-gray-600'
                                                                }`}
                                                            style={{ width: `${overallProgress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400 min-w-[35px]">{overallProgress}%</span>
                                                </div>
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

            {/* Rename Modal */}
            {renamingId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white">Rename Project</h3>
                            <p className="text-sm text-gray-400 mt-1">Change the project display name.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">New Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Enter project name..."
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-[#0F172A]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setRenamingId(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition"
                                disabled={isRenaming}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                disabled={isRenaming || !newName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-900/20"
                            >
                                {isRenaming ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
