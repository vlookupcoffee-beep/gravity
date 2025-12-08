'use client'

import { Upload, FileText, Plus, Loader2, Database, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { uploadKHS, deleteAllKHSItems } from '@/app/actions/upload-khs'
import { getKHSProviders } from '@/app/actions/get-khs-providers'

export default function KHSPage() {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)
    const [providers, setProviders] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        loadProviders()
    }, [])

    async function loadProviders() {
        setLoadingData(true)
        const data = await getKHSProviders()
        setProviders(data || [])
        setLoadingData(false)
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setUploadResult(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('providerName', 'PT INTERNUSA DUTA MAKMUR (IDNET)')

        try {
            const result = await uploadKHS(formData)
            setUploadResult(result)
            if (result.success) {
                loadProviders() // Refresh list
            }
        } catch (error) {
            console.error(error)
            setUploadResult({ error: 'An unexpected error occurred.' })
        } finally {
            setIsUploading(false)
        }
    }

    async function handleDeleteProvider(providerId: string, providerName: string) {
        if (!confirm(`⚠️ PERINGATAN: Ini akan menghapus SEMUA item dari "${providerName}"!\n\nAnda yakin ingin melanjutkan?`)) {
            return
        }

        if (!confirm('Konfirmasi sekali lagi: Semua data KHS dari provider ini akan dihapus permanen. Lanjutkan?')) {
            return
        }

        const result = await deleteAllKHSItems(providerId)

        if (result.success) {
            alert('✅ Semua item KHS berhasil dihapus!')
            loadProviders()
        } else {
            alert(`❌ Gagal menghapus: ${result.error}`)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Price Lists (KHS)</h1>
                    <p className="text-gray-400">Manage standard unit prices from different providers.</p>
                </div>
                <label className={`bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    <span>{isUploading ? 'Importing...' : 'Import KHS (CSV)'}</span>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isUploading} />
                </label>
            </div>

            {uploadResult && (
                <div className={`p-4 rounded-lg border ${uploadResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {uploadResult.success
                        ? `Successfully imported ${uploadResult.count} items from KHS!`
                        : uploadResult.error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loadingData ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 bg-[#1E293B] animate-pulse rounded-xl border border-gray-700"></div>
                    ))
                ) : providers.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-[#1E293B] rounded-xl border border-gray-700 border-dashed">
                        <Database size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium text-gray-400">No Price Lists Found</p>
                        <p className="text-sm">Please upload a CSV file to get started.</p>
                    </div>
                ) : (
                    providers.map((provider) => (
                        <div key={provider.id} className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition">
                                    <FileText size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                        {provider.items?.[0]?.count || 0} Items
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteProvider(provider.id, provider.name)
                                        }}
                                        className="p-1.5 bg-red-600/10 text-red-400 border border-red-600/30 rounded hover:bg-red-600/20 transition"
                                        title="Delete all items from this provider"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 truncate" title={provider.name}>{provider.name}</h3>
                            <p className="text-sm text-gray-400">Imported {new Date(provider.created_at).toLocaleDateString()}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
