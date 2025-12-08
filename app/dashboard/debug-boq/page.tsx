'use client'

import { useState } from 'react'
import { debugBOQItem, debugProjectBOQ } from '@/app/actions/debug-boq'

export default function BOQDebugPage() {
    const [itemCode, setItemCode] = useState('DC-OF-SM-48C')
    const [projectId, setProjectId] = useState('')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    async function checkItem() {
        setLoading(true)
        const data = await debugBOQItem(itemCode)
        setResult(data)
        setLoading(false)
    }

    async function checkProject() {
        if (!projectId) {
            alert('Please enter project ID')
            return
        }
        setLoading(true)
        const data = await debugProjectBOQ(projectId)
        setResult(data)
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#0F172A] p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-white">BOQ Debug Tool</h1>

                {/* Check Single Item */}
                <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-bold text-white mb-4">Check Single Item</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={itemCode}
                            onChange={(e) => setItemCode(e.target.value)}
                            placeholder="Item Code (e.g., DC-OF-SM-48C)"
                            className="flex-1 bg-[#0F172A] border border-gray-700 text-white rounded-lg px-4 py-2"
                        />
                        <button
                            onClick={checkItem}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Check Item'}
                        </button>
                    </div>
                </div>

                {/* Check Project */}
                <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                    <h2 className="text-lg font-bold text-white mb-4">Check Project BOQ</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            placeholder="Project ID (UUID)"
                            className="flex-1 bg-[#0F172A] border border-gray-700 text-white rounded-lg px-4 py-2"
                        />
                        <button
                            onClick={checkProject}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Check Project'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
                        <h2 className="text-lg font-bold text-white mb-4">Results</h2>
                        <pre className="bg-[#0F172A] p-4 rounded-lg text-gray-300 text-sm overflow-auto max-h-96">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}
