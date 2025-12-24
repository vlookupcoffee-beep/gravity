'use client'

import { useState, useEffect } from 'react'
import { getMaterials } from '@/app/actions/material-actions'
import { Plus, Minus, Package, Search, Filter } from 'lucide-react'
import AddMaterialModal from '@/components/dashboard/materials/AddMaterialModal'
import UpdateStockModal from '@/components/dashboard/materials/UpdateStockModal'

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)

    useEffect(() => {
        loadMaterials()
    }, [showAddModal, showUpdateModal]) // Reload when modals close/change

    async function loadMaterials() {
        setLoading(true)
        const data = await getMaterials()
        setMaterials(data)
        setLoading(false)
    }

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Material Monitoring</h1>
                    <p className="text-gray-500">Track inventory and usage of project materials</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowUpdateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Minus size={18} className="text-orange-500" />
                        Update Material Keluar
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        Input Material
                    </button>
                </div>
            </div>

            {/* Stats Overview (Optional, can be expanded) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Material Types</p>
                        <h3 className="text-2xl font-bold text-gray-900">{materials.length}</h3>
                    </div>
                </div>
                {/* Can add more stats like "Low Stock Items", "Total Value" etc. */}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Filter Bar */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Could add category filter here */}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                <th className="px-6 py-3 font-medium">Material Name</th>
                                <th className="px-6 py-3 font-medium text-center">Unit</th>
                                <th className="px-6 py-3 font-medium text-right">Current Stock</th>
                                <th className="px-6 py-3 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Loading materials...
                                    </td>
                                </tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No materials found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredMaterials.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{m.name}</div>
                                            {m.description && (
                                                <div className="text-xs text-gray-500 mt-1 max-w-md truncate" title={m.description}>
                                                    {m.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 bg-gray-50/30 font-mono text-xs">{m.unit}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">{m.current_stock}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${m.current_stock > 10 ? 'bg-green-100 text-green-800' :
                                                    m.current_stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {m.current_stock > 10 ? 'In Stock' :
                                                    m.current_stock > 0 ? 'Low Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
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
                    materials={materials}
                    onClose={() => setShowUpdateModal(false)}
                />
            )}
        </div>
    )
}
