'use client'

import { useState, useEffect } from 'react'
import { bulkCreateMaterials } from '@/app/actions/material-actions' // Re-use bulk create
import { getProjects } from '@/app/actions/get-projects'
import { Loader2, X, Plus, Trash2, AlertTriangle } from 'lucide-react'

interface AddMaterialModalProps {
    onClose: () => void
}

interface MaterialRow {
    id: string // Temp ID for React key
    name: string
    description: string
    unit: string
    initial_stock: number | string
    project_id: string
}

export default function AddMaterialModal({ onClose }: AddMaterialModalProps) {
    const [rows, setRows] = useState<MaterialRow[]>([
        { id: '1', name: '', description: '', unit: '', initial_stock: '', project_id: '' }
    ])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        getProjects().then(setProjects).catch(console.error)
    }, [])

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(), name: '', description: '', unit: '', initial_stock: '', project_id: '' }])
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
            project_id: r.project_id || undefined
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-semibold text-gray-900">Input Material (BOQ Mode)</h3>
                        <p className="text-xs text-gray-500">Add multiple materials quickly. Links to project if specified.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    {error && (
                        <div className="m-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 text-xs font-semibold text-gray-600 w-12 text-center">#</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 min-w-[200px]">Material Name *</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 min-w-[200px]">Description</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 w-24">Unit *</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 w-32">Qty (Stock)</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 w-64">Project (Optional)</th>
                                <th className="p-3 text-xs font-semibold text-gray-600 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, idx) => (
                                <tr key={row.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="p-2 text-center text-xs text-gray-400">{idx + 1}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Material Name"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={row.name}
                                            onChange={e => updateRow(row.id, 'name', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Specs / Desc"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={row.description}
                                            onChange={e => updateRow(row.id, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Unit"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={row.unit}
                                            onChange={e => updateRow(row.id, 'unit', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={row.initial_stock}
                                            onChange={e => updateRow(row.id, 'initial_stock', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={row.project_id}
                                            onChange={e => updateRow(row.id, 'project_id', e.target.value)}
                                        >
                                            <option value="">-- General Stock --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => removeRow(row.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                            disabled={rows.length === 1}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="p-4">
                        <button
                            onClick={addRow}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            Add Row
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Save Materials ({rows.filter(r => r.name).length})
                    </button>
                </div>
            </div>
        </div>
    )
}
