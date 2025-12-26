import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseTelegramMessage } from '@/utils/telegram-parser'

// Prevent caching for webhooks
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const update = await request.json()

        // Basic validation of Telegram Update structure
        if (!update.message || !update.message.text) {
            return NextResponse.json({ message: 'No message content' }, { status: 200 })
        }

        const text = update.message.text as string
        const chatId = update.message.chat.id

        // Only process /lapor commands
        if (!text.startsWith('/lapor')) {
            return NextResponse.json({ message: 'Not a report command' }, { status: 200 })
        }

        // Parse the message
        const reportData = parseTelegramMessage(text)

        if (!reportData.siteName) {
            // Could reply to user here if we had the mechanism, for now just log
            console.error('No Site Name found in report')
            return NextResponse.json({ message: 'No Site Name found' }, { status: 200 })
        }

        const supabase = await createClient()

        // 1. Find Project ID
        // Try exact match or loose match
        let projectId = null
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name')
            .ilike('name', `%${reportData.siteName}%`)
            .limit(1)

        if (projects && projects.length > 0) {
            projectId = projects[0].id
        }

        // 2. Create Daily Report
        const { data: report, error: reportError } = await supabase
            .from('daily_reports')
            .insert({
                project_id: projectId,
                report_date: new Date(), // Today
                manpower_count: reportData.manpower,
                executor_name: reportData.executor,
                waspang_name: reportData.waspang,
                today_activity: reportData.todayActivity,
                tomorrow_plan: reportData.tomorrowPlan,
                raw_message: text
            })
            .select()
            .single()

        if (reportError) {
            console.error('Error creating report:', reportError)
            return NextResponse.json({ error: reportError.message }, { status: 500 })
        }

        // 3. Process Items
        const processedItems = []
        for (const item of reportData.items) {
            // Find Material ID
            // Try simplified name matching (e.g. "NP-7.0-140-3S" from "NP-7.0-140-3S (TIANG 3S)")
            // Extract the first part before any brace or just the name

            // Heuristic: Split by '(' and take first part, trim.
            const searchName = item.rawName.split('(')[0].trim()

            let materialId = null
            // Try searching exact or ilike
            const { data: mats } = await supabase
                .from('materials')
                .select('id, name')
                .or(`name.ilike.%${searchName}%,name.eq.${searchName}`)
                .limit(1)

            if (mats && mats.length > 0) {
                materialId = mats[0].id
            }

            // Insert Item
            await supabase.from('daily_report_items').insert({
                report_id: report.id,
                material_id: materialId,
                material_name_snapshot: item.rawName,
                quantity_scope: item.scope,
                quantity_total: item.totalDone,
                quantity_today: item.todayDone
            })

            // 4. Update Stock (Transaction OUT) if Today > 0 and Material Found
            if (materialId && item.todayDone > 0) {
                // Check if transaction already exists for this report item? 
                // No, just insert.
                await supabase.from('material_transactions').insert({
                    material_id: materialId,
                    project_id: projectId,
                    transaction_type: 'OUT',
                    quantity: item.todayDone,
                    notes: `Telegram Auto-Report: ${reportData.siteName} (${new Date().toLocaleDateString()}) - ${item.rawName}`
                })

                // Update Material Current Stock (Decrement)
                // Fetch current first
                const { data: currentMat } = await supabase.from('materials').select('current_stock').eq('id', materialId).single()
                if (currentMat) {
                    await supabase.from('materials').update({
                        current_stock: (currentMat.current_stock || 0) - item.todayDone
                    }).eq('id', materialId)
                }
            }
        }

        return NextResponse.json({ success: true, reportId: report.id }, { status: 200 })

    } catch (e: any) {
        console.error('Webhook Error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
