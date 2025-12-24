'use client'

import { useState, useEffect } from 'react'
import { bulkCreateMaterials } from '@/app/actions/material-actions'
import { getProjects } from '@/app/actions/get-projects'
import { Loader2, X, Plus, Trash2, AlertTriangle, Package } from 'lucide-react'

interface AddMaterialModalProps {
    onClose: () => void
}

interface MaterialRow {
    id: string
    name: string
    description: string
    unit: string
    initial_stock: number | string
}

export default function AddMaterialModal({ onClose }: AddMaterialModalProps) {
    // Global Project Selection
    const [globalProjectId, setGlobalProjectId] = useState<string>('')

    // Rows
    const [rows, setRows] = useState<MaterialRow[]>([
        { id: '1', name: '', description: '', unit: '', initial_stock: '' }
    ])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        getProjects().then(setProjects).catch(console.error)
    }, [])

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(), name: '', description: '', unit: '', initial_stock: '' }])
    }

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id))
        }
    }

    const updateRow = (id: string, field: keyof MaterialRow, value: any) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r))
    }

    async function handleSubmit() {
        setLoading(true)
        setError('')

        // Validate
        const validRows = rows.filter(r => r.name.trim() !== '')
        if (validRows.length === 0) {
            setError('Please add at least one material with a name.')
            setLoading(false)
            return
        }

        const payload = validRows.map(r => ({
            name: r.name,
            description: r.description,
            unit: r.unit,
            initial_stock: Number(r.initial_stock) || 0,
            project_id: globalProjectId || undefined // Apply global project ID
        }))

        const result = await bulkCreateMaterials(payload)

        if (result.success) {
            onClose()
        } else {
            setError(result.error || 'Failed to create materials')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="text-blue-600" size={20} />
                            Input Material (BOQ)
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Input multiple materials and assign them to a project.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Global Project Selector */}
                <div className="p-5 bg-gray-50/80 border-b border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Assign to Project <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                        <select
                            className="w-full md:w-1/2 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm transition-all"
                            value={globalProjectId}
                            onChange={e => setGlobalProjectId(e.target.value)}
                        >
                            <option value="">-- General / Central Stock (No Project) --</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-white p-0">
                    {error && (
                        <div className="m-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f9fafb] sticky top-0 z-10 shadow-sm ring-1 ring-gray-200/50">
                            <tr>
                                <th className="p-3 pl-5 text-xs font-bold text-gray-500 uppercase tracking-wider w-12 text-center">#</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Material Name *</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Qty *</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Unit *</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Description</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, idx) => (
                                <tr key={row.id} className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="p-3 pl-5 text-center text-xs font-medium text-gray-400">{idx + 1}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Item Name"
                                            className="w-full px-3 py-2 text-sm border-gray-200 bg-transparent focus:bg-white border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                                            value={row.name}
                                            onChange={e => updateRow(row.id, 'name', e.target.value)}
                                            autoFocus={idx === rows.length - 1 && idx > 0} // Auto-focus new rows
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-3 py-2 text-sm border-gray-200 bg-transparent focus:bg-white border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 font-mono"
                                            value={row.initial_stock}
                                            onChange={e => updateRow(row.id, 'initial_stock', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="m/pcs"
                                            className="w-full px-3 py-2 text-sm border-gray-200 bg-transparent focus:bg-white border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                                            value={row.unit}
                                            onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Specification..."
                                            className="w-full px-3 py-2 text-sm border-gray-200 bg-transparent focus:bg-white border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300 text-gray-500"
                                            value={row.description}
                                            onChange={e => updateRow(row.id, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                                            disabled={rows.length === 1}
                                            tabIndex={-1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="p-4 border-t border-dashed border-gray-200">
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 items-center">
                    <span className="text-xs text-gray-500 mr-auto">
                        <strong>Tip:</strong> Ensure you select the correct project before saving.
                    </span>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Save Materials ({rows.filter(r => r.name).length})
                    </button>
                </div>
            </div>
        </div>
    )
}
