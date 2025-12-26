'use client'

import { useState, useEffect } from 'react'
import { bulkCreateMaterials } from '@/app/actions/material-actions'
import { getProjects } from '@/app/actions/get-projects'
import { Loader2, X, Upload, AlertTriangle, Check, FileSpreadsheet } from 'lucide-react'

interface BulkImportModalProps {
    onClose: () => void
}

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'input' | 'preview'>('input')
    const [rawText, setRawText] = useState('')
    const [parsedData, setParsedData] = useState<any[]>([])
    const [error, setError] = useState('')

    // Import Type
    const [importType, setImportType] = useState<'STOCK' | 'REQUIREMENT'>('STOCK')

    // Global Project Selection
    const [globalProjectId, setGlobalProjectId] = useState<string>('')
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        getProjects().then(setProjects).catch(console.error)
    }, [])

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

            // Simple CSV/TSV parser
            const cols = line.split(delimiter).map(c => c.trim())

            let name = cols[0]
            let description = ''
            let unit = 'pcs'
            let stock = 0

            // Try to be smart about column mapping
            if (cols.length >= 4) {
                // Name | Desc | Unit | Stock
                description = cols[1]
                unit = cols[2]
                stock = parseFloat(cols[3]) || 0
            } else if (cols.length === 3) {
                // Heuristic: Name | Unit | Stock vs Name | Desc | Stock
                // If col 2 is number, it's stock.
                if (!isNaN(parseFloat(cols[2]))) {
                    // Name | Unit? | Stock
                    unit = cols[1] // assume col 1 is unit if col 2 is number
                    stock = parseFloat(cols[2])
                } else {
                    // Name | Desc | Stock?
                    description = cols[1]
                    if (!isNaN(parseFloat(cols[2]))) {
                        stock = parseFloat(cols[2])
                    } else {
                        // Name | Desc | Unit (Stock 0)
                        unit = cols[2]
                        stock = 0
                    }
                }
            } else if (cols.length === 2) {
                // Name | Stock or Name | Unit?
                if (!isNaN(parseFloat(cols[1]))) {
                    stock = parseFloat(cols[1])
                } else {
                    unit = cols[1]
                    stock = 0
                }
            }

            if (name) {
                data.push({
                    name,
                    description,
                    unit,
                    initial_stock: stock,
                    project_id: globalProjectId || undefined // Link to selected project
                })
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
        if (importType === 'REQUIREMENT' && !globalProjectId) {
            setError('Please select a project for Requirements import.')
            return
        }

        setLoading(true)
        // Ensure project ID is applied if it wasn't during parse (e.g. user changed selection after parse)
        const finalData = parsedData.map(d => ({
            ...d,
            project_id: globalProjectId || undefined,
            import_type: importType
        }))

        const result = await bulkCreateMaterials(finalData)

        if (result.success) {
            onClose()
        } else {
            if (result.errors && Array.isArray(result.errors)) {
                // Format list of errors
                const errorMsg = result.errors.map((e: any) => `${e.name}: ${e.error}`).join(' | ')
                setError(errorMsg)
            } else {
                setError(result.error || 'Failed to import materials')
            }
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileSpreadsheet className="text-green-600" size={20} />
                            Bulk Import Materials
                        </h3>
                        <p className="text-xs text-gray-500">Paste data from Excel or CSV.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-gray-50/80 border-b border-gray-100 grid md:grid-cols-2 gap-4">
                    {/* Import Type Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Import As
                        </label>
                        <select
                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                            value={importType}
                            onChange={e => setImportType(e.target.value as 'STOCK' | 'REQUIREMENT')}
                        >
                            <option value="STOCK">Stock / Material Masuk</option>
                            <option value="REQUIREMENT">Kebutuhan Project (Requirements)</option>
                        </select>
                    </div>

                    {/* Global Project Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {importType === 'REQUIREMENT' ? 'Assign to Project (Required)' : 'Assign to Project (Optional)'}
                        </label>
                        <select
                            className={`w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all
                                ${importType === 'REQUIREMENT' && !globalProjectId ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'}
                            `}
                            value={globalProjectId}
                            onChange={e => setGlobalProjectId(e.target.value)}
                            required={importType === 'REQUIREMENT'}
                        >
                            <option value="">{importType === 'REQUIREMENT' ? '-- Select Project (Required) --' : '-- General / Central Stock --'}</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
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
                            <div className={`border rounded-lg p-4 text-sm ${importType === 'REQUIREMENT' ? 'bg-purple-50 border-purple-100 text-purple-900' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                <p className="font-semibold mb-1">Instructions ({importType === 'REQUIREMENT' ? 'Requirements' : 'Stock'}):</p>
                                <p>1. Copy columns from your spreadsheet (Excel/Google Sheets).</p>
                                <p>2. Paste them below.</p>
                                <p className="mt-2 text-xs opacity-75">Supported Columns Order: <strong>Name | Description | Unit | Quantity</strong></p>
                                <p className="text-xs opacity-75">Or simplified: <strong>Name | Unit | Quantity</strong></p>
                                {importType === 'REQUIREMENT' && (
                                    <p className="mt-2 font-bold text-xs">Note: This will set the required quantity for the selected project.</p>
                                )}
                            </div>

                            <textarea
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs leading-relaxed"
                                placeholder={`Pipa PVC 2 inch\tPipa air bersih\tm\t50\nKabel NYM 2x1.5\tKabel Listrik\troll\t10`}
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Please verify the parsed data below before importing:</p>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Description</th>
                                            <th className="px-4 py-2">Unit</th>
                                            <th className="px-4 py-2 text-right">{importType === 'REQUIREMENT' ? 'Needs' : 'Stock'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium text-gray-900">{row.name}</td>
                                                <td className="px-4 py-2 text-gray-500 truncate max-w-xs text-xs">{row.description}</td>
                                                <td className="px-4 py-2 text-gray-500 text-xs font-mono">{row.unit}</td>
                                                <td className="px-4 py-2 text-right font-medium">{row.initial_stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Found <strong>{parsedData.length}</strong> items to import.</span>
                                <span>Type: <strong>{importType}</strong> | Project: <strong>{projects.find(p => p.id === globalProjectId)?.name || 'None'}</strong></span>
                            </div>
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
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Check size={16} />
                                Parse Data
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
