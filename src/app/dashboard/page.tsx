
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

            const { data: structures } = await supabase.from('structures').select('*')
            const { data: routesData } = await supabase.from('routes').select('*')

            if (structures) {
                const parsedMarkers = structures.map((s: any) => {
                    // Extract coords from PostGIS POINT(x y)
                    // Format: POINT(113.536138722429 -8.27537259962564)
                    const match = s.coordinates.match(/POINT\(([\d\.]+) ([\d\.-]+)\)/)
                    if (match) {
                        return {
                            id: s.id,
                            position: [parseFloat(match[2]), parseFloat(match[1])], // Lat, Lon
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
                    // Extract coords from PostGIS LINESTRING(x y, x y, ...)
                    const match = r.path.match(/LINESTRING\((.*)\)/)
                    if (match) {
                        const points = match[1].split(',').map((p: string) => {
                            const [lon, lat] = p.trim().split(' ').map(Number)
                            return [lat, lon]
                        })
                        return {
                            id: r.id,
                            positions: points,
                            name: r.name,
                            type: r.type
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
