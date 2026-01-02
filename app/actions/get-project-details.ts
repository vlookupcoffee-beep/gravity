'use server'

import { createClient } from '@/utils/supabase/server'
import { getProjectMaterialSummary } from './material-actions'

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

    // Fetch project metadata
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    // Fetch PoW tasks to calculate dynamic progress and for the report breakdown
    const { data: powTasks } = await supabase
        .from('pow_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

    let calculatedProgress = project?.progress || 0
    if (powTasks && powTasks.length > 0) {
        const total = powTasks.reduce((acc, t) => acc + (t.progress || 0), 0)
        calculatedProgress = Math.round(total / powTasks.length)
    }

    // Fetch files
    const { data: files } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    // Group structures by name
    const structureBreakdown: Record<string, number> = {}
    if (structures) {
        structures.forEach((s: any) => {
            const key = s.name || s.type
            structureBreakdown[key] = (structureBreakdown[key] || 0) + 1
        })
    }

    // Calculate length for each route (exclude HDPE)
    const routeBreakdown: Array<{ name: string; length: number; type: string }> = []
    if (routes) {
        routes.forEach((route: any) => {
            // Skip HDPE karena sudah include dalam route kabel
            if (route.type === 'HDPE' || route.name?.includes('HDPE')) {
                return
            }

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
                length: Math.round(length * 100) / 100,
                type: route.type
            })
        })
    }

    // Fetch material summary
    const materialSummary = await getProjectMaterialSummary(projectId)

    // Fetch the latest daily report
    const { data: dailyReport } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('report_date', { ascending: false })
        .limit(1)
        .single()

    return {
        ...project,
        progress: calculatedProgress,
        structures: structureBreakdown,
        routes: routeBreakdown,
        files: files || [],
        materialSummary: materialSummary || [],
        powTasks: powTasks || [],
        dailyReport: dailyReport || null
    }
}
