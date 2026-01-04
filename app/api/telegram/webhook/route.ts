import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseTelegramMessage } from '@/utils/telegram-parser'
import { syncPowProgressWithMaterials } from '@/app/actions/pow-sync-actions'
import { getProjectDetails } from '@/app/actions/get-project-details'
import { formatProjectReport } from '@/app/actions/telegram-actions'

// Prevent caching for webhooks
export const dynamic = 'force-dynamic'

// Helper to send message back to Telegram
async function sendTelegramReply(chatId: number, text: string) {
    const token = process.env.BOT_TELEGRAM_TOKEN
    if (!token) {
        console.error('BOT_TELEGRAM_TOKEN not set')
        return
    }

    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        })
    } catch (e) {
        console.error('Failed to send Telegram reply:', e)
    }
}

export async function POST(request: NextRequest) {
    try {
        const update = await request.json()

        // Basic validation of Telegram Update structure
        if (!update.message || !update.message.text) {
            return NextResponse.json({ message: 'No message content' }, { status: 200 })
        }

        const text = update.message.text as string
        const chatId = update.message.chat.id

        // Case 1: /project command - List all projects
        if (text.startsWith('/project')) {
            const supabase = await createClient()
            const { data: projects } = await supabase
                .from('projects')
                .select('name')
                .order('name', { ascending: true })

            if (!projects || projects.length === 0) {
                await sendTelegramReply(chatId, '📭 **Belum ada proyek** yang terdaftar di database.')
                return NextResponse.json({ message: 'No projects found' }, { status: 200 })
            }

            let listMessage = `📋 **DAFTAR PROYEK AKTIF**\n\n`;
            projects.forEach((p: any, index: number) => {
                listMessage += `${index + 1}. \`${p.name}\`\n`;
            });
            listMessage += `\n💡 *Gunakan \`/status Nama Proyek\` untuk melihat detail.*`;

            await sendTelegramReply(chatId, listMessage)
            return NextResponse.json({ success: true }, { status: 200 })
        }

        // Case 2: /status command
        if (text.startsWith('/status')) {
            const projectName = text.replace('/status', '').trim()

            if (!projectName) {
                await sendTelegramReply(chatId, '❓ **Gunakan Format:** `/status NAMA PROJECT`')
                return NextResponse.json({ message: 'Missing project name' }, { status: 200 })
            }

            const supabase = await createClient()
            const { data: projects } = await supabase
                .from('projects')
                .select('id, name')
                .ilike('name', `%${projectName}%`)
                .limit(1)

            if (!projects || projects.length === 0) {
                await sendTelegramReply(chatId, `❌ **Proyek Tidak Ditemukan:** "*${projectName}*" tidak ada di database.`)
                return NextResponse.json({ message: 'Project not found' }, { status: 200 })
            }

            const projectDetails = await getProjectDetails(projects[0].id)

            // Calculate material ratio if possible (global ratio)
            const materialSummary = projectDetails.materialSummary || []
            let totalNeeded = 0
            let totalUsed = 0
            materialSummary.forEach((m: any) => {
                totalNeeded += m.total_needed || 0
                totalUsed += m.total_out || 0
            })
            const materialRatio = totalNeeded > 0 ? Math.round((totalUsed / totalNeeded) * 100) : 0

            const reportMessage = await formatProjectReport({
                ...projectDetails,
                materialRatio
            })

            await sendTelegramReply(chatId, reportMessage)
            return NextResponse.json({ success: true }, { status: 200 })
        }

        // Case 2: /lapor command
        if (!text.startsWith('/lapor')) {
            return NextResponse.json({ message: 'Not a recognized command' }, { status: 200 })
        }

        // Parse the message
        const reportData = parseTelegramMessage(text)

        if (!reportData.siteName) {
            await sendTelegramReply(chatId, '❌ **Gagal Parse**: Site Name tidak ditemukan. Pastikan format benar:\n`Site Name : NAMA PROJECT`')
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

        if (!projectId) {
            await sendTelegramReply(chatId, `❌ **Gagal**: Project dengan nama "*${reportData.siteName}*" tidak ditemukan di database.\n\nPastikan nama di laporan sama dengan nama di web.`)
            return NextResponse.json({ message: 'Project not found' }, { status: 200 })
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
            await sendTelegramReply(chatId, `❌ **System Error**: Gagal menyimpan laporan. \n${reportError.message}`)
            return NextResponse.json({ error: reportError.message }, { status: 500 })
        }

        // 3. Process Items
        let updatedItemsCount = 0
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
                updatedItemsCount++
            }
        }

        // Success Reply
        const projectStatus = projectId ? `✅ Project Found: *${projects?.[0]?.name}*` : `⚠️ Project Not Found (Saved as General Report)`

        // 5. Trigger PoW Sync if project found
        if (projectId) {
            await syncPowProgressWithMaterials(projectId)
        }

        await sendTelegramReply(chatId, `✅ **Laporan Diterima!**\n\n${projectStatus}\n\n📊 Items Processed: ${reportData.items.length}\n📉 Stock Updates: ${updatedItemsCount} Items deducted.\n🔄 PoW Progress Updated.\n\nTerima kasih, laporan tersimpan.`)

        return NextResponse.json({ success: true, reportId: report.id }, { status: 200 })

    } catch (e: any) {
        console.error('Webhook Error:', e)
        // Try to reply error if possible
        try {
            // Need to get chatId from request if possible, but parsing failed maybe?
        } catch { }
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
