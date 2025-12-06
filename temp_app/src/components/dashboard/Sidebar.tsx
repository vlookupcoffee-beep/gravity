
'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/app/actions/get-projects'
import KmlUploader from '@/components/tools/KmlUploader'
import StatsCard from './StatsCard'
import { Activity, Map as MapIcon, Database, HardDrive } from 'lucide-react'

export default function Sidebar() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        setLoading(true)
        const data = await getProjects()
        setProjects(data)
        setLoading(false)
    }

    const totalStructures = projects.reduce((acc, p) => acc + p.structureCount, 0)
    const totalLength = projects.reduce((acc, p) => acc + p.routeLength, 0)

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full bg-gray-50/50">
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className="text-xl font-bold text-gray-900">Gravity Network</span>
                </div>

                <KmlUploader />
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">

                <div className="grid grid-cols-1 gap-3">
                    <StatsCard
                        label="Total Length"
                        value={`${(totalLength / 1000).toFixed(2)} km`}
                        icon={Activity}
                    />
                    <StatsCard
                        label="Structures"
                        value={totalStructures}
                        icon={HardDrive}
                    />
                    <StatsCard
                        label="Projects"
                        value={projects.length}
                        icon={Database}
                    />
                </div>

                <div className="mt-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Active Projects</h3>
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
                        ) : projects.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">No projects yet</div>
                        ) : (
                            projects.map((p) => (
                                <div key={p.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 truncate flex-1" title={p.name}>{p.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <HardDrive size={10} /> {p.structureCount}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Activity size={10} /> {(p.routeLength / 1000).toFixed(1)} km
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white text-xs text-center text-gray-400">
                v0.1.0 • ID-NET Gravity
            </div>
        </div>
    )
}
