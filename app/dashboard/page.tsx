'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import { getAllPowTasks } from '@/app/actions/pow-actions'
import { renameProject } from '@/app/actions/project-actions'
import StatsCard from '@/components/dashboard/StatsCard'
import { Activity, CheckCircle, Clock, Database, Plus, TrendingUp, CheckCircle2, AlertCircle, Pencil, FileText } from 'lucide-react'
import Link from 'next/link'
import ProjectReportModal from '@/components/dashboard/ProjectReportModal'
import { getCurrentUser } from '@/app/actions/auth-actions'

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [powTasks, setPowTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [isRenaming, setIsRenaming] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        const [projectsData, powData, user] = await Promise.all([
            getProjects(),
            getAllPowTasks(),
            getCurrentUser()
        ])
        setProjects(projectsData)
        setPowTasks(powData)
        setUserRole(user?.role || null)
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
    const totalValue = projects.reduce((acc, p) => acc + (userRole === 'mandor' ? (p.value_mandor || 0) : (p.value || 0)), 0)

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
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-400 mt-1 font-medium italic">Monitoring your project evolution in real-time.</p>
                </div>
                <div className="flex gap-3">
                    {userRole !== 'mandor' && (
                        <>
                            <button
                                onClick={() => setShowReport(true)}
                                className="bg-[#1E293B]/50 backdrop-blur-md text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-700 transition-all border border-gray-700/50 shadow-lg active:scale-95"
                            >
                                <FileText size={18} className="text-blue-400" />
                                <span className="font-semibold text-sm">Global Report</span>
                            </button>
                            <Link
                                href="/dashboard/projects/new"
                                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all shadow-xl shadow-blue-900/40 active:scale-95 border border-blue-400/20"
                            >
                                <Plus size={18} />
                                <span className="font-semibold text-sm">New Project</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatsCard
                    label="Active Nodes"
                    value={totalProjects}
                    icon={Database}
                />
                <StatsCard
                    label="Milestones Met"
                    value={completedProjects}
                    icon={CheckCircle}
                />
                <StatsCard
                    label="In Execution"
                    value={inProgressProjects}
                    icon={Activity}
                />
                <StatsCard
                    label={userRole === 'mandor' ? "Accumulated Mandor" : "Global Portfolio Value"}
                    value={formatCurrency(totalValue)}
                    icon={TrendingUp}
                    className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A] border-blue-500/20 shadow-blue-500/5"
                />
            </div>

            {/* PoW Table Widget */}
            <div className="bg-[#1E293B]/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-700/50 bg-[#1E293B]/20">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                            <h2 className="text-xl font-bold text-white tracking-tight italic">Operations Roadmap</h2>
                        </div>
                        <Link href="/dashboard/projects" className="bg-[#0F172A]/50 border border-gray-700/50 text-blue-400 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/10 transition-all uppercase tracking-widest">
                            Archive List
                        </Link>
                    </div>
                    {/* Search Bar */}
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Find specific project sequence..."
                            className="w-full bg-[#0F172A]/80 border border-gray-700/50 text-white rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                            onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase()
                                const rows = document.querySelectorAll('[data-project-row]')
                                rows.forEach((row: any) => {
                                    const projectName = row.getAttribute('data-project-name').toLowerCase()
                                    row.style.display = projectName.includes(searchTerm) ? '' : 'none'
                                })
                            }}
                        />
                        <svg className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No projects available.</div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <table className="w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="bg-[#0F172A]/80 backdrop-blur-md text-gray-400 font-bold border-b border-gray-700/50 uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4 sticky left-0 bg-[#0F172A] z-20 border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">No</th>
                                    <th className="px-6 py-4 sticky left-14 bg-[#0F172A] z-20 min-w-[240px] border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">Project Designation</th>
                                    <th className="px-6 py-4 sticky left-[294px] bg-[#0F172A] z-20 text-center border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">Progress</th>
                                    <th className="px-4 py-4 text-center bg-blue-500/10 border-l border-gray-700 group/h" colSpan={3}>
                                        <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                                            PHASE 1: PREPARATION
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center bg-purple-500/10 border-l border-gray-700 group/h" colSpan={4}>
                                        <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse"></span>
                                            PHASE 2: LOGISTICS
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center bg-orange-500/10 border-l border-gray-700 group/h" colSpan={6}>
                                        <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></span>
                                            PHASE 3: DEPLOYMENT
                                        </div>
                                    </th>
                                    <th className="px-4 py-4 text-center bg-green-500/10 border-l border-gray-700 group/h">
                                        <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                                            PHASE 4: CLOSING
                                        </div>
                                    </th>
                                </tr>
                                <tr className="text-[9px] bg-[#0F172A]/40">
                                    <th className="px-6 py-2 sticky left-0 bg-[#0F172A] z-20 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]"></th>
                                    <th className="px-6 py-2 sticky left-14 bg-[#0F172A] z-20 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]"></th>
                                    <th className="px-6 py-2 sticky left-[294px] bg-[#0F172A] z-20 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]"></th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/30">KOM</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">SURVEY</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">DRM</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/30">FABRIKASI</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">HDPE</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">KABEL</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">TIANG</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/30">IJIN</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">HDPE</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">TIANG</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">KABEL</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">JOINT</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/10">TEST</th>
                                    <th className="px-2 py-3 text-center border-l border-gray-700/30">ATP</th>
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
                                            className="group/tr hover:bg-white/[0.03] transition-colors duration-200 border-b border-gray-800/30"
                                            data-project-row
                                            data-project-name={project.name}
                                        >
                                            <td className="px-6 py-5 text-gray-500 font-mono text-xs sticky left-0 bg-[#1E293B] group-hover/tr:bg-[#253247] z-10 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="px-6 py-5 sticky left-14 bg-[#1E293B] group-hover/tr:bg-[#253247] z-10 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
                                                <div className="flex items-center justify-between group/name">
                                                    <Link href={`/dashboard/projects/${project.id}`} className="text-white hover:text-blue-400 font-bold text-sm tracking-tight block truncate pr-4 transition-colors">
                                                        {project.name}
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setRenamingId(project.id)
                                                            setNewName(project.name)
                                                        }}
                                                        className="opacity-0 group-hover/tr:opacity-100 text-gray-500 hover:text-white transition-all p-1.5 bg-gray-800/50 rounded-lg hover:bg-blue-600/20"
                                                        title="Rename Project"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 sticky left-[294px] bg-[#1E293B] group-hover/tr:bg-[#253247] z-10 border-r border-gray-700/50 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
                                                <div className="flex flex-col gap-1 w-full min-w-[100px]">
                                                    <div className="flex justify-between items-end">
                                                        <span className={`text-[10px] font-black tracking-tighter ${overallProgress === 100 ? 'text-green-400' : 'text-gray-400'}`}>
                                                            {overallProgress === 100 ? 'SUCCESS' : 'EXECUTING'}
                                                        </span>
                                                        <span className="text-[11px] font-black text-white">{overallProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${overallProgress === 100 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                                                overallProgress >= 50 ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                                                                    overallProgress > 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gray-700'
                                                                }`}
                                                            style={{ width: `${overallProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            {/* PREPARING */}
                                            <td className="px-2 py-5 text-center border-l border-gray-700/30 group-hover/tr:bg-blue-500/5 transition-colors">{getTaskIcon('1.2')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-blue-500/5 transition-colors">{getTaskIcon('1.3')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-blue-500/5 transition-colors">{getTaskIcon('1.4')}</td>
                                            {/* MATERIAL DELIVERY */}
                                            <td className="px-2 py-5 text-center border-l border-gray-700/30 group-hover/tr:bg-purple-500/5 transition-colors">{getTaskIcon('2.1')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-purple-500/5 transition-colors">{getTaskIcon('2.2')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-purple-500/5 transition-colors">{getTaskIcon('2.3')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-purple-500/5 transition-colors">{getTaskIcon('2.4')}</td>
                                            {/* INSTALASI & COMMISSIONING */}
                                            <td className="px-2 py-5 text-center border-l border-gray-700/30 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.1')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.2')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.3')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.4')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.5')}</td>
                                            <td className="px-2 py-5 text-center border-l border-gray-700/10 group-hover/tr:bg-orange-500/5 transition-colors">{getTaskIcon('3.6')}</td>
                                            {/* CLOSING */}
                                            <td className="px-2 py-5 text-center border-l border-gray-700/30 group-hover/tr:bg-green-500/5 transition-colors">{getTaskIcon('4.1')}</td>
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

            {/* Report Modal */}
            {showReport && (
                <ProjectReportModal
                    mode="global"
                    data={projects}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    )
}
