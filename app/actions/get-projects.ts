
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getProjects() {
    const supabase = await createClient()

    const { data: projects, error } = await supabase
        .from('projects')
        .select(`
      id,
      name,
      created_at
    `)
        .order('created_at', { ascending: false })

    if (error || !projects) {
        console.error('Error fetching projects:', error)
        return []
    }

    // Fetch stats for each project
    // Note: For production, this should be a stored procedure or view for performance
    const projectsWithStats = await Promise.all(projects.map(async (p) => {
        const { count: structureCount } = await supabase
            .from('structures')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', p.id)

        // Calculate total length using PostGIS
        const { data: routeStats } = await supabase
            .rpc('calculate_project_route_length', { p_id: p.id })

        return {
            ...p,
            structureCount: structureCount || 0,
            routeLength: routeStats || 0
        }
    }))

    return projectsWithStats
}
