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
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const { getProjectDetails } = await import('@/app/actions/get-project-details')
            const { getCurrentUser } = await import('@/app/actions/auth-actions')

            const [data, user] = await Promise.all([
                getProjectDetails(projectId),
                getCurrentUser()
            ])

            setDetails(data)
            setUserRole(user?.role || null)
            setLoading(false)
        }
        load()
    }, [projectId])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">{projectName}</h2>
                    <div className="flex items-center gap-2">
                        {/* Hide Edit for restricted users */}
                        {/* Add Edit button here if needed in future, but explicit requirement is that restricted_viewer can't edit */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
                            <div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
                            <div className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Structures Breakdown */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Structures
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    {Object.keys(details.structures).length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No structures recorded</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.entries(details.structures).map(([name, count]: [string, any]) => (
                                                <div key={name} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-gray-700">{name}</span>
                                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Routes Breakdown */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Routes / Lines
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    {details.routes.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No routes recorded</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {details.routes.map((route: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-gray-700 truncate max-w-[70%]">{route.name}</span>
                                                    <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">{route.length.toFixed(2)} km</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Material Usage */}
                            <MaterialUsage projectId={projectId} />

                            {/* Total Summary */}
                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <span className="text-base font-bold text-gray-900">Total Route Length</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        {details.routes.reduce((sum: number, r: any) => sum + r.length, 0).toFixed(2)} <span className="text-sm font-normal text-gray-500">km</span>
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

function MaterialUsage({ projectId }: { projectId: string }) {
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const { getProjectMaterials } = await import('@/app/actions/material-actions')
            const data = await getProjectMaterials(projectId)
            setMaterials(data)
            setLoading(false)
        }
        load()
    }, [projectId])

    return (
        <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Materials Used
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                {loading ? (
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2"></div>
                    </div>
                ) : materials.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No material usage recorded</p>
                ) : (
                    <div className="space-y-2">
                        {materials.map((m) => (
                            <div key={m.id} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700">{m.name}</span>
                                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs">{m.total} {m.unit}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
