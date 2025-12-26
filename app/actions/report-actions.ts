'use server'

import { createClient } from '@/utils/supabase/server'

export async function getDailyReports(projectId: string) {
    const supabase = await createClient()

    const { data: reports, error } = await supabase
        .from('daily_reports')
        .select(`
            *,
            items:daily_report_items(*)
        `)
        .eq('project_id', projectId)
        .order('report_date', { ascending: false })

    if (error) {
        console.error('Error fetching daily reports:', error)
        return []
    }

    return reports
}
