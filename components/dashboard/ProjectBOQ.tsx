'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Save, X } from 'lucide-react'
import { getKHSItems, addProjectItem, getProjectItems, deleteProjectItem } from '@/app/actions/boq-actions'
import { getKHSProviders } from '@/app/actions/get-khs-providers'

interface Props {
    projectId: string
    onUpdate?: () => void
}

export default function ProjectBOQ({ projectId, onUpdate }: Props) {
    const [items, setItems] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Modal State
    const [providers, setProviders] = useState<any[]>([])
    const [selectedProvider, setSelectedProvider] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [khsItems, setKhsItems] = useState<any[]>([])
    const [selectedKHSItem, setSelectedKHSItem] = useState<any>(null)
    const [quantity, setQuantity] = useState(1)
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        loadProjectItems()
        loadProviders()
    }, [])

    useEffect(() => {
        if (selectedProvider) {
            loadKHSItems(selectedProvider, searchTerm)
        }
    }, [selectedProvider, searchTerm])

    async function loadProjectItems() {
        const data = await getProjectItems(projectId)
        setItems(data || [])
    }

    async function loadProviders() {
        const data = await getKHSProviders()
        setProviders(data || [])
        if (data && data.length > 0) setSelectedProvider(data[0].id)
    }

    async function loadKHSItems(provId: string, search: string) {
        const data = await getKHSItems(provId, search)
        setKhsItems(data || [])
    }

    async function handleAddItem() {
        if (!selectedKHSItem) return
        setAdding(true)
        const result = await addProjectItem(projectId, selectedKHSItem, Number(quantity))
        setAdding(false)

        if (result.success) {
            setIsModalOpen(false)
            loadProjectItems() // Refresh list
            setQuantity(1)
            setSelectedKHSItem(null)
            onUpdate?.()
        } else {
            alert('Failed to add item')
        }
    }

    async function handleDelete(itemId: string) {
        if (!confirm('Are you sure you want to delete this item?')) return
        await deleteProjectItem(itemId, projectId)
        loadProjectItems()
        onUpdate?.()
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

    const totalValue = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0)

    return (
        <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-white">Work Items (BOQ)</h3>
                    <p className="text-sm text-gray-400">Total Est. Value: <span className="text-green-400 font-mono">{formatCurrency(totalValue)}</span></p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus size={16} /> Add Item
                </button>
            </div>

            {items.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-400 font-medium">No items added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add items from the KHS to start calculating project value.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0F172A] text-gray-400 font-medium border-b border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Item Code</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3 text-right">Unit Price</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-white font-mono text-xs">{item.item_code}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.description}</td>
                                    <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(item.unit_price)}</td>
                                    <td className="px-4 py-3 text-center text-white font-semibold">{item.quantity} {item.unit}</td>
                                    <td className="px-4 py-3 text-right text-green-400">{formatCurrency(item.unit_price * item.quantity)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD ITEM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#1E293B] rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-white">Add Item from KHS</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-4 bg-[#0F172A] border-b border-gray-700 space-y-4">
                            {/* Filters */}
                            <div className="flex gap-4">
                                <select
                                    className="bg-[#1E293B] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm flex-1"
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                >
                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search item code or description..."
                                        className="w-full bg-[#1E293B] border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {khsItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedKHSItem(item)}
                                    className={`p-3 rounded-lg cursor-pointer border transition flex justify-between items-center ${selectedKHSItem?.id === item.id ? 'bg-blue-600/20 border-blue-500' : 'border-transparent hover:bg-gray-800'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded">{item.item_code}</span>
                                            <span className="text-sm text-gray-300 font-medium">{item.description}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-medium text-sm">{formatCurrency(item.price)}</p>
                                        <p className="text-xs text-gray-500">/{item.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-[#0F172A] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-400">Volume / Qty:</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="bg-[#1E293B] border border-gray-700 text-white rounded-lg w-24 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                />
                                <span className="text-sm text-gray-500">{selectedKHSItem?.unit}</span>
                            </div>
                            <button
                                onClick={handleAddItem}
                                disabled={!selectedKHSItem || adding}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                {adding ? 'Adding...' : 'Confirm & Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
