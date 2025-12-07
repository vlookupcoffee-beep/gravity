'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import KmlUploader from '@/components/tools/KmlUploader'

// Dynamically import MapComponent
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
})

export default function MapPage() {
    const [markers, setMarkers] = useState<any[]>([])
    const [routes, setRoutes] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: structures } = await supabase
                .from('structures')
                .select('id, name, type, coordinates')
            const { data: routesData } = await supabase
                .from('routes')
                .select('id, name, type, path')

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
    }, [])

    return (
        <div className="relative h-[calc(100vh-4rem)] rounded-xl overflow-hidden border border-gray-200">
            <MapComponent markers={markers} routes={routes} />

            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-[1000] w-72">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Map Tools</h3>
                <KmlUploader />
            </div>
        </div>
    )
}
