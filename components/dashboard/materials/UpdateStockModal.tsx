'use client'

import { useState, useEffect } from 'react'
import { useMaterial, addStock } from '@/app/actions/material-actions'
import { getProjects } from '@/app/actions/get-projects'
import { Loader2, X, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'

interface UpdateStockModalProps {
    materials: any[]
    onClose: () => void
}

export default function UpdateStockModal({ materials, onClose }: UpdateStockModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedMaterialId, setSelectedMaterialId] = useState('')

    // Transaction Mode
    const [type, setType] = useState<'IN' | 'OUT'>('OUT')

    // Project selection
    const [projects, setProjects] = useState<any[]>([])
    const [loadingProjects, setLoadingProjects] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getProjects()
                setProjects(data)
            } catch (e) {
                console.error("Failed to load projects", e)
            } finally {
                setLoadingProjects(false)
            }
        }
        load()
    }, [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError('')

        let result;
        if (type === 'IN') {
            result = await addStock(formData)
        } else {
            result = await useMaterial(formData)
        }

        if (result.success) {
            onClose()
        } else {
            setError(result.error || 'Failed to update stock')
            setLoading(false)
        }
    }

    const selectedMaterial = materials.find(m => m.id === selectedMaterialId)

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Update Stock</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form action={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Transaction Type Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('IN')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'IN'
                                    ? 'bg-white text-green-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ArrowDown size={16} />
                            Masuk (IN)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('OUT')}
                            className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'OUT'
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ArrowUp size={16} />
                            Terpakai (OUT)
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Project <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <select
                            name="project_id"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="">{type === 'IN' ? '-- General Stock / Purchase --' : '-- General Usage --'}</option>
                            {loadingProjects ? (
                                <option disabled>Loading projects...</option>
                            ) : (
                                projects.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {type === 'OUT' && (
                            <p className="text-xs text-orange-600">Select a project to record usage for a specific job.</p>
                        )}
                        {type === 'IN' && (
                            <p className="text-xs text-green-600">Select a project if this material was purchased specifically for it.</p>
                        )}
                    </div>

                    <div className="border-t border-gray-200 my-4"></div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Select Material</label>
                        <select
                            name="material_id"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            onChange={(e) => setSelectedMaterialId(e.target.value)}
                            value={selectedMaterialId}
                        >
                            <option value="">-- Select Material --</option>
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} (Stock: {m.current_stock} {m.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedMaterial && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            Current Stock: {selectedMaterial.current_stock} {selectedMaterial.unit}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Quantity {type === 'IN' ? 'In' : 'Out'}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="quantity"
                                min="0.01"
                                step="any"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="0"
                            />
                            {selectedMaterial && (
                                <span className="text-sm text-gray-500 font-medium">{selectedMaterial.unit}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            name="notes"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            placeholder="Additional details..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {type === 'IN' ? 'Add Stock' : 'Record Usage'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
