'use server'

import { createClient } from '@/utils/supabase/server'

// Haversine formula untuk menghitung jarak antara 2 koordinat (dalam km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius bumi dalam km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export async function getProjectDetails(projectId: string) {
    const supabase = await createClient()

    // Fetch structures dengan grouping by type
    const { data: structures } = await supabase
        .from('structures')
        .select('name, type')
        .eq('project_id', projectId)

    // Fetch routes dengan path untuk hitung panjang
    const { data: routes } = await supabase
        .from('routes')
        .select('name, type, path')
        .eq('project_id', projectId)

    // Group structures by name
    const structureBreakdown: Record<string, number> = {}
    if (structures) {
        structures.forEach((s: any) => {
            const key = s.name || s.type
            structureBreakdown[key] = (structureBreakdown[key] || 0) + 1
        })
    }

    // Calculate length for each route
    const routeBreakdown: Array<{ name: string; length: number }> = []
    if (routes) {
        routes.forEach((route: any) => {
            let length = 0
            if (Array.isArray(route.path) && route.path.length > 1) {
                for (let i = 0; i < route.path.length - 1; i++) {
                    const p1 = route.path[i]
                    const p2 = route.path[i + 1]
                    if (p1.lat && p1.lon && p2.lat && p2.lon) {
                        length += haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon)
                    }
                }
            }
            routeBreakdown.push({
                name: route.name || route.type,
                length: Math.round(length * 100) / 100
            })
        })
    }

    return {
        structures: structureBreakdown,
        routes: routeBreakdown
    }
}
