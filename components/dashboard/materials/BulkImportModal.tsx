'use client'

import { useState } from 'react'
import { bulkCreateMaterials } from '@/app/actions/material-actions'
import { Loader2, X, Upload, AlertTriangle, Check } from 'lucide-react'

interface BulkImportModalProps {
    onClose: () => void
}

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'input' | 'preview'>('input')
    const [rawText, setRawText] = useState('')
    const [parsedData, setParsedData] = useState<any[]>([])
    const [error, setError] = useState('')

    // Auto-detect columns and parse
    function parseData() {
        if (!rawText.trim()) {
            setError('Please paste some data first')
            return
        }

        const lines = rawText.trim().split('\n')
        const data = []

        // Detect delimiter (Tab or Comma)
        const firstLine = lines[0]
        const isTab = firstLine.includes('\t')
        const delimiter = isTab ? '\t' : ','

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Simple CSV/TSV parser (does not handle quoted strings with delimiters inside)
            const cols = line.split(delimiter).map(c => c.trim())

            // Expected format order, or try to be smart? 
            // Let's assume: Name | Description | Unit | Stock
            // Or: Name | Unit | Stock

            let name = cols[0]
            let description = ''
            let unit = 'pcs'
            let stock = 0

            if (cols.length >= 4) {
                description = cols[1]
                unit = cols[2]
                stock = parseFloat(cols[3]) || 0
            } else if (cols.length === 3) {
                // Name | Unit | Stock (Maybe desc is missing)
                // OR Name | Desc | Unit (Stock missing)
                // Let's guess based on column 2 content (if it looks like a number?)
                if (!isNaN(parseFloat(cols[2]))) {
                    unit = cols[1]
                    stock = parseFloat(cols[2])
                } else {
                    description = cols[1]
                    unit = cols[2]
                }
            } else if (cols.length === 2) {
                unit = cols[1]
            }

            if (name) {
                data.push({ name, description, unit, initial_stock: stock })
            }
        }

        if (data.length === 0) {
            setError('Could not parse any data')
            return
        }

        setParsedData(data)
        setStep('preview')
        setError('')
    }

    async function handleSubmit() {
        setLoading(true)
        const result = await bulkCreateMaterials(parsedData)

        if (result.success) {
            onClose()
        } else {
            setError(result.error || 'Failed to import materials')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Bulk Import Materials</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {step === 'input' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                                <p className="font-semibold mb-1">Instructions:</p>
                                <p>Paste your data from Excel or CSV below. The system will try to auto-detect columns.</p>
                                <p className="mt-1 text-xs opacity-75">Recommended Format: <strong>Name | Description | Unit | Initial Stock</strong></p>
                            </div>

                            <textarea
                                className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                placeholder={`Item A\tDescription for A\tunit\t10\nItem B\tDescription for B\tunit\t5`}
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Please verify the parsed data below before importing:</p>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Description</th>
                                            <th className="px-4 py-2">Unit</th>
                                            <th className="px-4 py-2 text-right">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium">{row.name}</td>
                                                <td className="px-4 py-2 text-gray-500 truncate max-w-xs">{row.description}</td>
                                                <td className="px-4 py-2 text-gray-500">{row.unit}</td>
                                                <td className="px-4 py-2 text-right">{row.initial_stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 text-right">Found {parsedData.length} items.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    {step === 'preview' ? (
                        <button
                            onClick={() => setStep('input')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Back to Input
                        </button>
                    ) : (
                        <div></div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>

                        {step === 'input' ? (
                            <button
                                onClick={parseData}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Check size={16} />
                                Parse Data
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Import {parsedData.length} Items
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
