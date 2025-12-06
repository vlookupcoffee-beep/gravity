
'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
})

export default function DashboardPage() {
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
                    // Koordinat bisa dalam format text atau object
                    let coords = s.coordinates

                    // Jika coordinates adalah object dengan coordinates property
                    if (typeof coords === 'object' && coords.coordinates) {
                        const [lon, lat] = coords.coordinates
                        return {
                            id: s.id,
                            position: [lat, lon],
                            name: s.name,
                            type: s.type
                        }
                    }

                    // Jika format POINT(lon lat)
                    if (typeof coords === 'string') {
                        const match = coords.match(/POINT\(([\d\.\-]+)\s+([\d\.\-]+)\)/)
                        if (match) {
                            return {
                                id: s.id,
                                position: [parseFloat(match[2]), parseFloat(match[1])],
                                name: s.name,
                                type: s.type
                            }
                        }
                    }

                    return null
                }).filter(Boolean)
                setMarkers(parsedMarkers)
            }

            if (routesData) {
                const parsedRoutes = routesData.map((r: any) => {
                    let path = r.path

                    // Jika path adalah object dengan coordinates property
                    if (typeof path === 'object' && path.coordinates) {
                        const points = path.coordinates.map(([lon, lat]: number[]) => [lat, lon])
                        return {
                            id: r.id,
                            positions: points,
                            name: r.name,
                            type: r.type
                        }
                    }

                    // Jika format LINESTRING(lon lat, lon lat, ...)
                    if (typeof path === 'string') {
                        const match = path.match(/LINESTRING\((.*)\)/)
                        if (match) {
                            const points = match[1].split(',').map((p: string) => {
                                const [lon, lat] = p.trim().split(/\s+/).map(Number)
                                return [lat, lon]
                            })
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
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative h-full">
                <MapComponent markers={markers} routes={routes} />
            </main>
        </div>
    )
}
