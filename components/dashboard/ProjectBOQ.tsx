'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Save, X, Upload } from 'lucide-react' // Added Upload icon
import { getKHSItems, addProjectItem, getProjectItems, deleteProjectItem, deleteAllProjectItems } from '@/app/actions/boq-actions'
import { getKHSProviders } from '@/app/actions/get-khs-providers'

interface Props {
    projectId: string
    onUpdate?: () => void
    userRole?: string | null
}

export default function ProjectBOQ({ projectId, onUpdate, userRole }: Props) {
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
    const [rowSelectionType, setRowSelectionType] = useState<'vendor' | 'mandor'>('vendor')

    // Upload & Recalculate State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [uploading, setUploading] = useState(false)

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
        // Pass the rowSelectionType as part of the item metadata
        const itemWithSelection = { ...selectedKHSItem, uploadType: rowSelectionType }
        const result = await addProjectItem(projectId, itemWithSelection, Number(quantity))
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

    async function handleRecalculate() {
        // Dynamic import to call the server action
        const { recalculateProjectValue } = await import('@/app/actions/boq-actions')
        await recalculateProjectValue(projectId)
        onUpdate?.()
        alert('Project value recalculated!')
    }

    async function handleDeleteAll() {
        if (!confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA item BOQ dari project ini!\n\nAnda yakin ingin melanjutkan?')) {
            return
        }

        if (!confirm('Konfirmasi sekali lagi: Semua data BOQ akan dihapus permanen. Lanjutkan?')) {
            return
        }

        const result = await deleteAllProjectItems(projectId)

        if (result.success) {
            alert('✅ Semua item BOQ berhasil dihapus!')
            loadProjectItems()
            onUpdate?.()
        } else {
            alert(`❌ Gagal menghapus: ${result.error}`)
        }
    }

    async function handleFileUpload(e: React.FormEvent<HTMLInputElement>) {
        if (!e.currentTarget.files || e.currentTarget.files.length === 0) return
        if (!selectedProvider) {
            alert('Please select a provider first')
            return
        }

        setUploading(true)
        const file = e.currentTarget.files[0]
        const formData = new FormData()
        formData.append('file', file)

        const { uploadProjectItems } = await import('@/app/actions/boq-actions')

        formData.append('uploadType', rowSelectionType) // Use the same selection type for bulk upload
        const result = await uploadProjectItems(projectId, selectedProvider, formData)
        setUploading(false)

        if (result.success) {
            const skippedMsg = result.skipped
                ? `\n\n${result.skipped} item dilewati (Kode tidak ditemukan di KHS): \n${result.skippedCodes?.join(', ')}${result.skipped > 5 ? '...' : ''}`
                : ''
            alert(`✅ Sukses mengimpor ${result.count || 0} item!${skippedMsg}`)
            setIsUploadModalOpen(false)
            loadProjectItems()
            onUpdate?.()
        } else {
            alert(`Import failed: ${result.error}`)
        }

        // Reset input
        e.currentTarget.value = ''
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

    const totalValueVendor = items.reduce((acc, item) => acc + (Number(item.unit_price || 0) * Number(item.quantity || 0)), 0)
    const totalValueMandor = items.reduce((acc, item) => acc + (Number(item.unit_price_mandor || 0) * Number(item.quantity_mandor || 0)), 0)

    return (
        <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-white">Work Items (BOQ)</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        {userRole !== 'mandor' && (
                            <p className="text-sm text-gray-400">Total Vendor: <span className="text-green-400 font-mono">{formatCurrency(totalValueVendor)}</span></p>
                        )}
                        <p className="text-sm text-gray-400">Total Mandor: <span className="text-blue-400 font-mono">{formatCurrency(totalValueMandor)}</span></p>
                        {userRole !== 'mandor' && (
                            <button onClick={handleRecalculate} className="text-xs text-gray-500 hover:text-blue-400 underline" title="Recalculate total value">
                                Force Refresh
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {userRole !== 'mandor' && (
                        <>
                            {items.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="bg-red-600/10 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600/20 transition flex items-center gap-2"
                                    title="Delete all BOQ items"
                                >
                                    <Trash2 size={16} /> Delete All
                                </button>
                            )}
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-600 transition flex items-center gap-2"
                            >
                                <Upload size={16} /> Import CSV
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-400 font-medium">No items added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Add items manually or import from CSV.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0F172A] text-gray-400 font-medium border-b border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Item Code</th>
                                <th className="px-4 py-3">Description</th>
                                {userRole !== 'mandor' && (
                                    <>
                                        <th className="px-4 py-3 text-right bg-green-500/5">Vendor Price</th>
                                        <th className="px-4 py-3 text-center bg-green-500/5">Qty Vendor</th>
                                    </>
                                )}
                                <th className="px-4 py-3 text-right bg-blue-500/5">Mandor Price</th>
                                <th className="px-4 py-3 text-center bg-blue-500/5">Qty Mandor</th>
                                {userRole !== 'mandor' && <th className="px-4 py-3">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-white font-mono text-xs">{item.item_code}</td>
                                    <td className="px-4 py-3 text-gray-300">{item.description}</td>

                                    {/* Vendor Columns */}
                                    {userRole !== 'mandor' && (
                                        <>
                                            <td className="px-4 py-3 text-right text-gray-400 bg-green-500/5">{formatCurrency(item.unit_price)}</td>
                                            <td className="px-4 py-3 text-center text-white font-semibold bg-green-500/5">
                                                {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(item.quantity || 0)} {item.unit}
                                            </td>
                                        </>
                                    )}

                                    {/* Mandor Columns */}
                                    <td className="px-4 py-3 text-right text-gray-400 bg-blue-500/5">{formatCurrency(item.unit_price_mandor || 0)}</td>
                                    <td className="px-4 py-3 text-center text-white font-semibold bg-blue-500/5">
                                        {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(item.quantity_mandor || 0)} {item.unit}
                                    </td>

                                    {userRole !== 'mandor' && (
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    )}
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
                                        <div className="flex flex-col items-end">
                                            <p className="text-green-400 font-medium text-xs">V: {formatCurrency(item.price)}</p>
                                            <p className="text-blue-400 font-medium text-xs">M: {formatCurrency(item.price_mandor || 0)}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">/{item.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-[#0F172A] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-gray-400">Qty:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="bg-[#1E293B] border border-gray-700 text-white rounded-lg w-20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-gray-500">{selectedKHSItem?.unit}</span>
                                </div>
                                <div className="flex bg-[#1E293B] p-1 rounded-lg border border-gray-700">
                                    <button
                                        onClick={() => setRowSelectionType('vendor')}
                                        className={`px-3 py-1 text-xs rounded-md transition ${rowSelectionType === 'vendor' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Vendor
                                    </button>
                                    <button
                                        onClick={() => setRowSelectionType('mandor')}
                                        className={`px-3 py-1 text-xs rounded-md transition ${rowSelectionType === 'mandor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Mandor
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddItem()}
                                disabled={!selectedKHSItem || adding}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                                {adding ? 'Adding...' : 'Confirm & Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOAD CSV MODAL */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#1E293B] rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">Import Items from CSV</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Select KHS Provider (Source)</label>
                                <select
                                    className="w-full bg-[#0F172A] border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                >
                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Import Side (Destination)</label>
                                <div className="flex bg-[#0F172A] p-1 rounded-lg border border-gray-600">
                                    <button
                                        onClick={() => setRowSelectionType('vendor')}
                                        className={`flex-1 py-2 text-sm rounded-md transition ${rowSelectionType === 'vendor' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Vendor
                                    </button>
                                    <button
                                        onClick={() => setRowSelectionType('mandor')}
                                        className={`flex-1 py-2 text-sm rounded-md transition ${rowSelectionType === 'mandor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Mandor
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border border-dashed border-gray-600 rounded-lg bg-[#0F172A]/50 text-center">
                                <p className="text-sm text-gray-400 mb-2">Upload CSV with format:</p>
                                <code className="block bg-black/30 p-2 rounded text-xs text-blue-300 mb-4">Item Code; Quantity</code>

                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    id="csv-upload"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className={`inline-block px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${uploading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {uploading ? 'Importing...' : 'Select CSV File'}
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 text-center">Data will be added only to the selected side.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
