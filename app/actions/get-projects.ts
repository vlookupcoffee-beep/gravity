
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

export async function getProjects() {
    const supabase = await createClient()

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      created_at,
      status,
      value,
      value_mandor,
      description,
      progress,
      start_date,
      end_date
    `)
        .order('created_at', { ascending: false })

    if (error || !projects) {
        console.error('Error fetching projects:', error)
        return []
    }

    // Fetch stats for each project
    const projectsWithStats = await Promise.all(projects.map(async (p) => {
        const { count: structureCount } = await supabase
            .from('structures')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id)

        // Hitung total panjang route dari JSON coordinates
        const { data: routes } = await supabase
            .from('routes')
            .select('path')
            .eq('project_id', p.id)

        let totalLength = 0
        if (routes) {
            routes.forEach((route: any) => {
                // Skip HDPE karena sudah include dalam route kabel (KFU)
                if (route.type === 'HDPE' || route.name?.includes('HDPE')) {
                    console.log(`Skipping HDPE route: "${route.name}"`)
                    return
                }

                if (Array.isArray(route.path) && route.path.length > 1) {
                    let routeLength = 0
                    // Hitung jarak untuk setiap segmen
                    for (let i = 0; i < route.path.length - 1; i++) {
                        const p1 = route.path[i]
                        const p2 = route.path[i + 1]
                        if (p1.lat && p1.lon && p2.lat && p2.lon) {
                            const segmentLength = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon)
                            routeLength += segmentLength
                        }
                    }
                    console.log(`Route "${route.name}": ${routeLength.toFixed(2)} km (${route.path.length} points)`)
                    totalLength += routeLength
                }
            })
        }
        console.log(`Total calculated length (excluding HDPE): ${totalLength.toFixed(2)} km`)

        return {
            ...p,
            structureCount: structureCount || 0,
            routeLength: Math.round(totalLength * 100) / 100 // Round to 2 decimal
        }
    }))

    return projectsWithStats
}
