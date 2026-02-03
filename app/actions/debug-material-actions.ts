'use server'

import { createClient } from '@/utils/supabase/server'

export async function debugMaterialTransactions(projectName: string) {
    const supabase = await createClient()

    try {
        // 1. Find project
        const { data: project } = await supabase
            .from('projects')
            .select('id, name')
            .ilike('name', `%${projectName}%`)
            .single()

        if (!project) {
            return { error: `Project not found: ${projectName}` }
        }

        // 2. Get approved reports
        const { data: reports } = await supabase
            .from('daily_reports')
            .select('id, distribusi_name, status, created_at')
            .eq('project_id', project.id)
            .eq('status', 'APPROVED')
            .order('created_at', { ascending: false })
            .limit(5)

        // 3. Get transactions
        const { data: transactions } = await supabase
            .from('material_transactions')
            .select(`
                id,
                transaction_type,
                quantity,
                distribution_name,
                created_at,
                materials (
                    name
                )
            `)
            .eq('project_id', project.id)
            .eq('transaction_type', 'OUT')
            .order('created_at', { ascending: false })
            .limit(10)

        // 4. Get requirements
        const { data: requirements } = await supabase
            .from('project_material_requirements')
            .select(`
                quantity_needed,
                distribution_name,
                materials (
                    name
                )
            `)
            .eq('project_id', project.id)

        // 5. Get all distribution names used
        const { data: txDists } = await supabase
            .from('material_transactions')
            .select('distribution_name')
            .eq('project_id', project.id)
            .neq('distribution_name', '')

        const distNames = Array.from(new Set(txDists?.map(d => d.distribution_name)))

        return {
            success: true,
            project,
            reports,
            transactions,
            requirements,
            distributionNames: distNames
        }
    } catch (e: any) {
        return { error: e.message }
    }
}
