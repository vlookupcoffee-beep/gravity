'use client'

import { Upload, FileText, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { uploadKHS } from '@/app/actions/upload-khs'

export default function KHSPage() {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setUploadResult(null)

        const formData = new FormData()
        formData.append('file', file)
        // Hardcoded provider name for this specific file, or could be dynamic
        formData.append('providerName', 'PT INTERNUSA DUTA MAKMUR (IDNET)')

        try {
            const result = await uploadKHS(formData)
            setUploadResult(result)
        } catch (error) {
            console.error(error)
            setUploadResult({ error: 'An unexpected error occurred.' })
        } finally {
            setIsUploading(false)
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
                {/* Example Card for Existing Data - In real app, map this from DB */}
                <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs text-gray-500">Active</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">PT INTERNUSA DUTA MAKMUR</h3>
                    <p className="text-sm text-gray-400">Standard KHS for 2024/2025.</p>
                </div>

                {/* Placeholder for New Provider */}
                <button className="bg-[#0F172A] p-6 rounded-xl border border-dashed border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                    <div className="p-3 bg-gray-800 text-gray-400 rounded-full mb-3">
                        <Plus size={24} />
                    </div>
                    <h3 className="font-semibold text-white">Add New Provider</h3>
                    <p className="text-xs text-gray-500 mt-1">Create a blank price list</p>
                </button>
            </div>
        </div>
    )
}
