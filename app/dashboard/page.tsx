
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

            console.log('Structures from DB:', structures)

            if (structures) {
                const parsedMarkers = structures.map((s: any) => {
                    const coords = s.coordinates

                    // Format JSON: {lat: number, lon: number}
                    if (coords && typeof coords === 'object' && coords.lat && coords.lon) {
                        return {
                            id: s.id,
                            position: [coords.lat, coords.lon],
                            name: s.name,
                            type: s.type
                        }
                    }

                    console.warn('Invalid coordinates for structure:', s)
                    return null
                }).filter(Boolean)

                console.log('Parsed markers:', parsedMarkers)
                setMarkers(parsedMarkers)
            }

            console.log('Routes from DB:', routesData)

            if (routesData) {
                const parsedRoutes = routesData.map((r: any) => {
                    const path = r.path

                    // Format JSON: [{lat: number, lon: number}, ...]
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

                    console.warn('Invalid path for route:', r)
                    return null
                }).filter(Boolean)

                console.log('Parsed routes:', parsedRoutes)
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
