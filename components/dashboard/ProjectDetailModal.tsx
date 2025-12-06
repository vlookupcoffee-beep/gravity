'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProjectDetails } from '@/app/actions/get-project-details'

interface ProjectDetailModalProps {
    projectId: string
    projectName: string
    onClose: () => void
}

export default function ProjectDetailModal({ projectId, projectName, onClose }: ProjectDetailModalProps) {
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDetails() {
            setLoading(true)
            const data = await getProjectDetails(projectId)
            setDetails(data)
            setLoading(false)
        }
        loadDetails()
    }, [projectId])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{projectName}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
                            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Structures Breakdown */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                    Structures
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {Object.keys(details.structures).length === 0 ? (
                                        <p className="text-sm text-gray-500">No structures</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.entries(details.structures).map(([name, count]: [string, any]) => (
                                                <div key={name} className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">{name}</span>
                                                    <span className="text-sm font-bold text-blue-600">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Routes Breakdown */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                    Routes / Lines
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    {details.routes.length === 0 ? (
                                        <p className="text-sm text-gray-500">No routes</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {details.routes.map((route: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">{route.name}</span>
                                                    <span className="text-sm font-bold text-green-600">{route.length.toFixed(2)} km</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Total Summary */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold text-gray-900">Total Length</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {details.routes.reduce((sum: number, r: any) => sum + r.length, 0).toFixed(2)} km
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
