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
import { bulkSyncAllProjectsPow } from '@/app/actions/pow-sync-actions'
import { RefreshCw } from 'lucide-react'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

export default function DashboardPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [powTasks, setPowTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
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

    const handleBulkSync = async () => {
        if (!confirm('PERINGATAN: Ini akan MENGHAPUS semua tugas PoW lama dan menggantinya dengan 10 tahap standar di SEMUA proyek. Progres akan dihitung ulang otomatis dari laporan. Lanjutkan?')) return

        setIsSyncing(true)
        const result = await bulkSyncAllProjectsPow()
        setIsSyncing(false)

        if (result.success) {
            alert(`Berhasil reset dan sinkronisasi! ${result.totalUpdated} perubahan diterapkan pada ${result.projectCount} proyek.`)
            load()
        } else {
            alert('Gagal melakukan sinkronisasi: ' + result.error)
        }
    }

    useEffect(() => {
        load()
    }, [])


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
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Ringkasan Dashboard</h1>
                    <p className="text-gray-400 mt-1 font-medium italic">Memantau evolusi proyek Anda secara real-time.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {userRole !== 'mandor' && (
                        <>
                            {userRole === 'owner' && (
                                <button
                                    onClick={handleBulkSync}
                                    disabled={isSyncing}
                                    className="bg-emerald-600/10 text-emerald-400 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-600/20 transition-all border border-emerald-600/20 shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                    <span className="font-semibold text-sm">{isSyncing ? 'Resetting...' : 'Reset & Sync All PoW'}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowReport(true)}
                                className="bg-[#1E293B]/50 backdrop-blur-md text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-700 transition-all border border-gray-700/50 shadow-lg active:scale-95"
                            >
                                <FileText size={18} className="text-blue-400" />
                                <span className="font-semibold text-sm">Laporan Global</span>
                            </button>
                            <Link
                                href="/dashboard/projects/new"
                                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all shadow-xl shadow-blue-900/40 active:scale-95 border border-blue-400/20"
                            >
                                <Plus size={18} />
                                <span className="font-semibold text-sm">Proyek Baru</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                <StatsCard
                    label="Titik Aktif"
                    value={totalProjects}
                    icon={Database}
                />
                <StatsCard
                    label="Milestone Tercapai"
                    value={completedProjects}
                    icon={CheckCircle}
                />
                <StatsCard
                    label="Dalam Pengerjaan"
                    value={inProgressProjects}
                    icon={Activity}
                />
                <StatsCard
                    label={userRole === 'mandor' ? "Akumulasi Mandor" : "Nilai Portofolio Global"}
                    value={formatCurrency(totalValue)}
                    icon={TrendingUp}
                    className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0F172A] border-blue-500/20 shadow-blue-500/5"
                />
            </div>

            <DashboardCharts projects={projects} />

            {/* PoW Table Widget */}
            <div className="bg-[#1E293B]/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-gray-700/50 bg-[#1E293B]/20">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                            <h2 className="text-xl font-bold text-white tracking-tight italic">Roadmap Operasional</h2>
                        </div>
                        <Link href="/dashboard/projects" className="bg-[#0F172A]/50 border border-gray-700/50 text-blue-400 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/10 transition-all uppercase tracking-widest">
                            Arsip Daftar
                        </Link>
                    </div>
                    {/* Search Bar */}
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Cari urutan proyek spesifik..."
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
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <table className="w-full text-left text-sm border-separate border-spacing-0">
                                <thead className="bg-[#0F172A]/80 backdrop-blur-md text-gray-400 font-bold border-b border-gray-700/50 uppercase tracking-widest text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4 sticky left-0 bg-[#0F172A] z-20 border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">No</th>
                                        <th className="px-6 py-4 sticky left-14 bg-[#0F172A] z-20 min-w-[240px] border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">Penamaan Proyek</th>
                                        <th className="px-6 py-4 sticky left-[294px] bg-[#0F172A] z-20 text-center border-r border-gray-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">Progres</th>
                                        <th className="px-4 py-4 text-center bg-blue-500/10 border-l border-gray-700 group/h" colSpan={3}>
                                            <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                                                TAHAP 1: PERSIAPAN
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center bg-purple-500/10 border-l border-gray-700 group/h" colSpan={4}>
                                            <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse"></span>
                                                TAHAP 2: LOGISTIK
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center bg-orange-500/10 border-l border-gray-700 group/h" colSpan={6}>
                                            <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></span>
                                                TAHAP 3: PEMASANGAN
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center bg-green-500/10 border-l border-gray-700 group/h">
                                            <div className="flex items-center justify-center gap-2 group-hover/h:scale-105 transition-transform">
                                                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                                                TAHAP 4: PENUTUPAN
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

                                        // Project identifier abstraction
                                        const siteId = `SITE-${project.id.slice(0, 4).toUpperCase()}`

                                        // Helper to get task status icon
                                        const getTaskIcon = (taskName: string) => {
                                            const task = projectTasks.find((t: any) => t.task_name.includes(taskName))
                                            if (!task) return <span className="text-gray-700/30">/</span>

                                            const icon = (() => {
                                                if (task.status === 'completed') return <CheckCircle2 className="text-blue-400 mx-auto" size={16} />
                                                if (task.status === 'in-progress') return <TrendingUp className="text-blue-400/60 mx-auto" size={16} />
                                                if (task.status === 'delayed') return <AlertCircle className="text-red-400/60 mx-auto" size={16} />
                                                return <Clock className="text-gray-600 mx-auto" size={14} />
                                            })()

                                            return (
                                                <div className="relative group flex justify-center items-center cursor-help">
                                                    {icon}
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 min-w-[200px] p-3 bg-gray-900/98 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl text-left animate-in fade-in slide-in-from-bottom-1">
                                                        <div className="font-bold text-white text-[11px] mb-2 border-b border-gray-800 pb-2 tracking-tight uppercase">{task.task_name}</div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                <span>Status</span>
                                                                <span className={
                                                                    task.status === 'completed' ? 'text-blue-400' :
                                                                        task.status === 'in-progress' ? 'text-blue-400/70' :
                                                                            task.status === 'delayed' ? 'text-red-400' : 'text-gray-500'
                                                                }>{task.status.replace('-', ' ')}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                <span>Progres</span>
                                                                <span className="text-white font-black">{task.progress || 0}%</span>
                                                            </div>
                                                            {task.description && (
                                                                <div className="pt-2 mt-1 border-t border-gray-800 text-[9px] text-gray-500 leading-relaxed italic">
                                                                    {task.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/98"></div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <tr
                                                key={project.id}
                                                className="group/tr hover:bg-blue-600/[0.02] transition-colors duration-300 border-b border-gray-800/20"
                                                data-project-row
                                                data-project-name={project.name}
                                            >
                                                <td className="px-6 py-4 text-gray-600 font-mono text-[10px] sticky left-0 bg-[#0F172A] group-hover/tr:bg-[#131b2e] z-10 border-r border-gray-800/30 transition-colors uppercase tracking-widest">{String(index + 1).padStart(2, '0')}</td>
                                                <td className="px-6 py-4 sticky left-14 bg-[#0F172A] group-hover/tr:bg-[#131b2e] z-10 border-r border-gray-800/30 transition-colors">
                                                    <div className="flex items-center justify-between group/name">
                                                        <Link href={`/dashboard/projects/${project.id}`} className="text-gray-300 group-hover/tr:text-white font-bold text-xs tracking-[0.15em] block truncate pr-4 transition-all uppercase">
                                                            {siteId}
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 sticky left-[294px] bg-[#0F172A] group-hover/tr:bg-[#131b2e] z-10 border-r border-gray-800/30 transition-colors">
                                                    <div className="flex items-center gap-3 w-full min-w-[120px]">
                                                        <div className="flex-1 bg-gray-900 rounded-full h-1 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${overallProgress === 100 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' :
                                                                    overallProgress >= 50 ? 'bg-blue-500/60' :
                                                                        overallProgress > 0 ? 'bg-blue-500/30' : 'bg-gray-800'
                                                                    }`}
                                                                style={{ width: `${overallProgress}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] font-black w-8 text-right ${overallProgress === 100 ? 'text-blue-400' : 'text-gray-400'}`}>
                                                            {overallProgress}%
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* PREPARING */}
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('1.2')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('1.3')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('1.4')}</td>
                                                {/* MATERIAL DELIVERY */}
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('2.1')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('2.2')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('2.3')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('2.4')}</td>
                                                {/* INSTALASI & COMMISSIONING */}
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.1')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.2')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.3')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.4')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.5')}</td>
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('3.6')}</td>
                                                {/* CLOSING */}
                                                <td className="px-1 py-4 text-center border-l border-gray-800/10 group-hover/tr:bg-blue-500/[0.01] transition-colors">{getTaskIcon('4.1')}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4 space-y-4">
                            {projects.map((project, index) => {
                                // Logic duplicated slightly for mobile, cleaner than prop drilling for this complexity
                                const projectTasks = powTasks.filter((t: any) => t.projects?.id === project.id)
                                const totalProgress = projectTasks.reduce((acc: number, t: any) => acc + (t.progress || 0), 0)
                                const overallProgress = projectTasks.length > 0 ? Math.round(totalProgress / projectTasks.length) : 0
                                const siteId = `SITE-${project.id.slice(0, 4).toUpperCase()}`

                                return (
                                    <div
                                        key={project.id}
                                        className="bg-[#1E293B]/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 shadow-lg active:scale-[0.98] transition-all duration-200"
                                        data-project-row
                                        data-project-name={project.name}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                                {siteId}
                                            </div>
                                            <div className={`
                                                px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                                ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-gray-700/30 text-gray-400 border border-gray-700'}
                                            `}>
                                                {project.status || 'Active'}
                                            </div>
                                        </div>

                                        <h3 className="text-white font-bold text-lg mb-4 truncate">{project.name}</h3>

                                        <div className="space-y-2 mb-5">
                                            <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                <span>Overall Progress</span>
                                                <span className={overallProgress === 100 ? 'text-blue-400' : 'text-white'}>{overallProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${overallProgress === 100 ? 'bg-blue-500' : 'bg-blue-600'
                                                        }`}
                                                    style={{ width: `${overallProgress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Link
                                            href={`/dashboard/projects/${project.id}`}
                                            className="block w-full text-center bg-[#0F172A] border border-gray-700/50 text-gray-300 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white hover:border-blue-500/50 transition-all uppercase tracking-wide"
                                        >
                                            Lihat Detail
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>


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
