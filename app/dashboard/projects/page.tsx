'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import { Search, Filter, Plus, FileText, Trash2, Edit, Map as MapIcon, Download } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth-actions'

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [filteredProjects, setFilteredProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        loadProjects()
    }, [])

    useEffect(() => {
        let result = projects

        // Search
        if (search) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description?.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Filter
        if (statusFilter !== 'all') {
            result = result.filter(p => p.status === statusFilter)
        }

        setFilteredProjects(result)
    }, [search, statusFilter, projects])

    async function loadProjects() {
        setLoading(true)
        const [data, user] = await Promise.all([
            getProjects(),
            getCurrentUser()
        ])
        setProjects(data)
        setFilteredProjects(data)
        setUserRole(user?.role || null)
        setLoading(false)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val || 0)
    }

    const getStatusLabel = (status: string) => {
        if (status === 'in-progress') return 'Dalam Pengerjaan'
        if (status === 'on-hold') return 'Ditangguhkan'
        if (status === 'completed') return 'Selesai'
        if (!status || status === 'planning') return 'Perencanaan'
        return status
    }

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setActiveDropdown(activeDropdown === id ? null : id)
    }

    const selectStatus = async (projectId: string, newStatus: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Optimistic update
        const updatedProjects = projects.map(p =>
            p.id === projectId ? { ...p, status: newStatus } : p
        )
        setProjects(updatedProjects)
        setFilteredProjects(updatedProjects)
        setActiveDropdown(null)

        const { updateProjectStatus } = await import('@/app/actions/project-actions')
        await updateProjectStatus(projectId, newStatus)
    }

    const handleDelete = async (projectId: string, projectName: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
            return
        }

        // Optimistic update - remove from list
        const updatedProjects = projects.filter(p => p.id !== projectId)
        setProjects(updatedProjects)
        setFilteredProjects(updatedProjects)

        const { deleteProject } = await import('@/app/actions/project-actions')
        const result = await deleteProject(projectId)

        if (!result.success) {
            // Revert on error
            alert('Failed to delete project: ' + result.error)
            loadProjects()
        }
    }

    const handleDownload = async (projectId: string, projectName: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const { downloadProjectArchive } = await import('@/app/actions/download-project')
            const result = await downloadProjectArchive(projectId)

            if (!result.success) {
                alert('Failed to download project: ' + result.error)
                return
            }

            // Convert base64 to blob and trigger download
            const byteCharacters = atob(result.data!)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'application/zip' })

            // Create download link
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = result.filename!
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error: any) {
            alert('Error downloading project: ' + error.message)
        }
    }


    return (
        <div className="space-y-6" onClick={() => setActiveDropdown(null)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Daftar Proyek</h1>
                    <p className="text-gray-400">Kelola dan pantau semua proyek teknik Anda.</p>
                    {/* DEBUG INFO - REMOVE LATER */}
                    <div className="text-xs text-yellow-500 font-mono mt-1">
                        Role Detected: {userRole ? `"${userRole}"` : 'null'} | Strict Match: {userRole === 'restricted_viewer' ? 'YES' : 'NO'}
                    </div>
                </div>
                {userRole !== 'mandor' && userRole !== 'restricted_viewer' && (
                    <Link
                        href="/dashboard/projects/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        <span>Buat Proyek Baru</span>
                    </Link>
                )}
            </div>

            {/* Controls */}
            <div className="bg-[#1E293B] p-4 rounded-xl border border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Cari proyek berdasarkan nama atau deskripsi..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-white placeholder-gray-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400" size={20} />
                    <select
                        className="border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="planning">Perencanaan</option>
                        <option value="in-progress">Dalam Pengerjaan</option>
                        <option value="completed">Selesai</option>
                        <option value="on-hold">Ditangguhkan</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1E293B] rounded-xl border border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0F172A] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Nama Proyek</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                {userRole !== 'restricted_viewer' && <th className="px-6 py-4 font-semibold">Nilai</th>}
                                <th className="px-6 py-4 font-semibold">Progres</th>
                                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Tidak ada proyek yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-800/50 transition group relative">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-white hover:text-blue-400">
                                                        {project.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">{project.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => userRole !== 'mandor' && userRole !== 'restricted_viewer' && toggleDropdown(project.id, e)}
                                                    disabled={userRole === 'mandor' || userRole === 'restricted_viewer'}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center justify-center min-w-[100px] whitespace-nowrap transition-colors ${project.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' :
                                                        project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' :
                                                            project.status === 'on-hold' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' :
                                                                'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'
                                                        } ${userRole === 'mandor' ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    {getStatusLabel(project.status)}
                                                </button>

                                                {/* Custom Dropdown Menu */}
                                                {activeDropdown === project.id && (
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-36 bg-[#0B1120] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                                        {['planning', 'in-progress', 'completed', 'on-hold'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={(e) => selectStatus(project.id, status, e)}
                                                                className={`w-full px-4 py-2 text-xs text-left transition-colors hover:bg-gray-800 ${(project.status || 'planning') === status
                                                                    ? 'text-white bg-blue-500/10 font-medium'
                                                                    : 'text-gray-400'
                                                                    }`}
                                                            >
                                                                {getStatusLabel(status)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {userRole !== 'restricted_viewer' && (
                                            <td className="px-6 py-4 text-sm font-medium text-gray-300">
                                                {formatCurrency(userRole === 'mandor' ? project.value_mandor : project.value)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                                                <div
                                                    className={`h-2 rounded-full ${project.progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${project.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{project.progress || 0}% Selesai</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/dashboard/map?projectId=${project.id}`}
                                                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                                                    title="View on Map"
                                                >
                                                    <MapIcon size={16} />
                                                </Link>
                                                <button
                                                    onClick={(e) => handleDownload(project.id, project.name, e)}
                                                    className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                                                    title="Unduh Proyek"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                {userRole !== 'mandor' && userRole !== 'restricted_viewer' && (
                                                    <>
                                                        <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition" title="Edit">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(project.id, project.name, e)}
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-700 flex justify-between items-center bg-[#0F172A]/50">
                    <p className="text-xs text-gray-400">Menampilkan {filteredProjects.length} proyek</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-700 rounded bg-[#1E293B] text-gray-300 text-xs disabled:opacity-50 hover:bg-gray-800" disabled>Sebelumnya</button>
                        <button className="px-3 py-1 border border-gray-700 rounded bg-[#1E293B] text-gray-300 text-xs disabled:opacity-50 hover:bg-gray-800" disabled>Berikutnya</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
