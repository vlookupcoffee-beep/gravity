'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import KmlUploader from '@/components/tools/KmlUploader'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Filter } from 'lucide-react'

// Dynamically import MapComponent
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
})

function MapContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const projectId = searchParams.get('projectId')

    const [markers, setMarkers] = useState<any[]>([])
    const [routes, setRoutes] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false })
            if (data) setProjects(data)
        }
        fetchProjects()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            let structuresQuery = supabase
                .from('structures')
                .select('id, name, type, coordinates')

            let routesQuery = supabase
                .from('routes')
                .select('id, name, type, path')

            // Apply filter if projectId is present
            if (projectId && projectId !== 'all') {
                structuresQuery = structuresQuery.eq('project_id', projectId)
                routesQuery = routesQuery.eq('project_id', projectId)
            }

            const { data: structures } = await structuresQuery
            const { data: routesData } = await routesQuery

            if (structures) {
                const parsedMarkers = structures.map((s: any) => {
                    const coords = s.coordinates
                    if (coords && typeof coords === 'object' && coords.lat && coords.lon) {
                        return {
                            id: s.id,
                            position: [coords.lat, coords.lon],
                            name: s.name,
                            type: s.type
                        }
                    }
                    return null
                }).filter(Boolean)
                setMarkers(parsedMarkers)
            }

            if (routesData) {
                const parsedRoutes = routesData.map((r: any) => {
                    const path = r.path
                    if (Array.isArray(path) && path.length > 0) {
                        const points = path.map((p: any) => {
                            if (p.lat && p.lon) {
                                return [p.lat, p.lon]
                            }
                            return null
                        }).filter(Boolean)

                        if (points.length > 0) {
                            return {
                                id: r.id,
                                positions: points,
                                name: r.name,
                                type: r.type
                            }
                        }
                    }
                    return null
                }).filter(Boolean)
                setRoutes(parsedRoutes)
            }
        }

        fetchData()
    }, [projectId])

    const handleProjectChange = (newProjectId: string) => {
        const params = new URLSearchParams(searchParams)
        if (newProjectId && newProjectId !== 'all') {
            params.set('projectId', newProjectId)
        } else {
            params.delete('projectId')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="relative h-[calc(100vh-4rem)] rounded-xl overflow-hidden border border-gray-200">
            <MapComponent markers={markers} routes={routes} />

            <div className="absolute top-4 right-4 z-[1000] w-72 space-y-4">
                {/* Project Filter */}
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Filter size={16} /> Filter Project
                    </h3>
                    <select
                        value={projectId || 'all'}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                    >
                        <option value="all">All Projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tools */}
                <div className="bg-white p-4 rounded-lg shadow-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Tools</h3>
                    <KmlUploader />
                </div>
            </div>
        </div>
    )
}

export default function MapPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading Map...</div>}>
            <MapContent />
        </Suspense>
    )
}
