'use client'

import { useState, useEffect } from 'react'
import { getMaterials, getProjectMaterialSummary, updateMaterialRequirement } from '@/app/actions/material-actions'
import { getProjects } from '@/app/actions/get-projects'
import BulkImportModal from '@/components/dashboard/materials/BulkImportModal'
import { Plus, Minus, Package, Search, Filter, Upload, Layers } from 'lucide-react'
import AddMaterialModal from '@/components/dashboard/materials/AddMaterialModal'
import UpdateStockModal from '@/components/dashboard/materials/UpdateStockModal'
import { useRouter } from 'next/navigation'

export default function MaterialsPage() {
    const router = useRouter()
    const [materials, setMaterials] = useState<any[]>([])
    const [projectMaterials, setProjectMaterials] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Filter State
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)

    useEffect(() => {
        if (!showAddModal && !showUpdateModal && !showBulkModal) {
            router.refresh()
            loadData()
        }
    }, [showAddModal, showUpdateModal, showBulkModal, router])

    useEffect(() => {
        if (selectedProjectId) {
            loadProjectSpecificData(selectedProjectId)
        }
    }, [selectedProjectId])

    async function loadData() {
        setLoading(true)
        const [mats, projs] = await Promise.all([
            getMaterials(),
            getProjects()
        ])
        setMaterials(mats)
        setProjects(projs)
        setLoading(false)
    }

    async function loadProjectSpecificData(id: string) {
        setLoading(true)
        const data = await getProjectMaterialSummary(id)
        setProjectMaterials(data)
        setLoading(false)
    }

    async function handleUpdateRequirement(materialId: string, value: string) {
        const quantity = parseFloat(value)
        if (isNaN(quantity) || quantity < 0) return

        await updateMaterialRequirement(selectedProjectId, materialId, quantity)
        // Optimistic update or reload
        loadProjectSpecificData(selectedProjectId)
    }

    const filteredMaterials = (selectedProjectId ? projectMaterials : materials).filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Materials</h1>
                    <p className="text-gray-400">Track inventory, usage, and project allocation.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-all shadow-sm text-sm"
                    >
                        <Upload size={16} />
                        Import
                    </button>
                    <button
                        onClick={() => setShowUpdateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-all shadow-sm text-sm"
                    >
                        <Minus size={16} className="text-orange-500" />
                        Update Stock
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 text-sm"
                    >
                        <Plus size={16} />
                        Input Material
                    </button>
                </div>
            </div>

            {/* Controls Layer */}
            <div className="bg-[#1E293B] p-4 rounded-xl border border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search materials..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-white placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Project Filter */}
                <div className="flex items-center gap-2 min-w-[250px]">
                    <Layers className="text-gray-400" size={20} />
                    <select
                        className="w-full border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#0F172A] text-white"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                        <option value="">All Projects (Global Stock)</option>
                        <optgroup label="Select Project">
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-[#1E293B] rounded-xl border border-gray-700 shadow-sm overflow-hidden min-h-[400px]">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-700 bg-[#0F172A]/50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                        {selectedProjectId ? (
                            <>
                                <Layers size={18} className="text-blue-400" />
                                Project Materials: <span className="text-white">{projects.find(p => p.id === selectedProjectId)?.name}</span>
                            </>
                        ) : (
                            <>
                                <Package size={18} className="text-gray-400" />
                                Global Inventory
                            </>
                        )}
                    </h3>
                    <span className="text-xs text-gray-500">{filteredMaterials.length} Items</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-[#0F172A] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Material Name</th>
                                <th className="px-6 py-4 font-semibold text-center w-24">Unit</th>

                                {selectedProjectId ? (
                                    <>
                                        <th className="px-6 py-4 font-semibold text-right text-purple-400 w-32">Kebutuhan</th>
                                        <th className="px-6 py-4 font-semibold text-right text-blue-400 w-32">Masuk</th>
                                        <th className="px-6 py-4 font-semibold text-right text-orange-400 w-32">Terpakai</th>
                                        <th className="px-6 py-4 font-semibold text-right w-32">Sisa</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 font-semibold text-right w-32">Global Stock</th>
                                        <th className="px-6 py-4 font-semibold text-right w-32">Status</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 animate-pulse">
                                        Loading inventory data...
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No materials found.
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{m.name}</div>
                                            {m.description && !selectedProjectId && (
                                                <div className="text-xs text-gray-500 mt-1 max-w-md truncate">
                                                    {m.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">{m.unit}</td>

                                        {selectedProjectId ? (
                                            <>
                                                <td className="px-6 py-4 text-right font-medium text-purple-400">
                                                    <input
                                                        type="number"
                                                        defaultValue={m.quantity_needed || 0}
                                                        className="w-20 bg-transparent border-b border-gray-700 text-right focus:border-purple-500 focus:outline-none"
                                                        onBlur={(e) => handleUpdateRequirement(m.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateRequirement(m.id, (e.target as HTMLInputElement).value)
                                                                    ; (e.target as HTMLInputElement).blur()
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-blue-400">
                                                    {m.total_in > 0 ? `+${m.total_in}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-orange-400">
                                                    {m.total_out > 0 ? `-${m.total_out}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-white">
                                                    {m.total_in - m.total_out}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-right font-medium text-white">{m.current_stock}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                        ${m.current_stock > 10 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            m.current_stock > 0 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {m.current_stock > 10 ? 'In Stock' :
                                                            m.current_stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Render Modals */}
            {showAddModal && (
                <AddMaterialModal onClose={() => setShowAddModal(false)} />
            )}

            {showUpdateModal && (
                <UpdateStockModal
                    materials={materials} // Always pass global materials list for selection
                    onClose={() => setShowUpdateModal(false)}
                />
            )}

            {showBulkModal && (
                <BulkImportModal onClose={() => setShowBulkModal(false)} />
            )}
        </div>
    )
}
