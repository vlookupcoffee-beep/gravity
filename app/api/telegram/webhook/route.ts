import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseTelegramMessage } from '@/utils/telegram-parser'
import { syncPowProgressWithMaterials } from '@/app/actions/pow-sync-actions'
import { getProjectDetails } from '@/app/actions/get-project-details'
import { formatProjectReport } from '@/app/actions/telegram-actions'

// Prevent caching for webhooks
export const dynamic = 'force-dynamic'

// Helper to send message with optional buttons
async function sendTelegramReply(chatId: number, text: string, replyMarkup?: any) {
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
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
            })
        })
    } catch (e) {
        console.error('Failed to send Telegram reply:', e)
    }
}

// Helper to edit existing message
async function editTelegramMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
    const token = process.env.BOT_TELEGRAM_TOKEN
    if (!token) return

    try {
        await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
            })
        })
    } catch (e) {
        console.error('Failed to edit Telegram message:', e)
    }
}

// Helper to answer callback query
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    const token = process.env.BOT_TELEGRAM_TOKEN
    if (!token) return

    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text
            })
        })
    } catch (e) {
        console.error('Failed to answer callback query:', e)
    }
}

export async function POST(request: NextRequest) {
    try {
        const update = await request.json()
        const supabase = await createClient()

        // --- HANDLE CALLBACK QUERIES ---
        if (update.callback_query) {
            const callbackQuery = update.callback_query
            const data = callbackQuery.data as string
            const chatId = callbackQuery.message.chat.id
            const messageId = callbackQuery.message.message_id
            const adminId = callbackQuery.from.id

            // Check if requester is Admin
            const { data: adminUser } = await supabase
                .from('telegram_authorized_users')
                .select('is_admin')
                .eq('telegram_id', adminId)
                .single()

            if (!adminUser?.is_admin) {
                await answerCallbackQuery(callbackQuery.id, "🚫 Anda bukan Admin!")
                return NextResponse.json({ success: true })
            }

            // Callback Logic: approve:[userId]
            if (data.startsWith('approve:')) {
                const targetUserId = data.split(':')[1]
                const name = callbackQuery.message.text.split('\n')[0].replace('📩 Permintaan Akses dari: ', '').trim()

                // Register user
                const { error: upsertError } = await supabase.from('telegram_authorized_users').upsert({
                    telegram_id: targetUserId,
                    name: name || `User ${targetUserId}`,
                    is_active: true
                })

                if (upsertError) {
                    console.error('Supabase Upsert Error:', upsertError)
                    await answerCallbackQuery(callbackQuery.id, "❌ Gagal mendaftarkan user di database.")
                    return NextResponse.json({ success: true })
                }

                await answerCallbackQuery(callbackQuery.id, "✅ User Disetujui!")

                // Show Project Selection Menu
                const { data: projects } = await supabase.from('projects').select('id, name').order('name')
                const { data: allowed } = await supabase.from('telegram_user_projects').select('project_id').eq('telegram_id', targetUserId)
                const allowedIds = allowed?.map(a => a.project_id) || []

                const buttons = projects?.map(p => ([{
                    text: `${allowedIds.includes(p.id) ? '✅' : '❌'} ${p.name}`,
                    callback_data: `toggle:${targetUserId}:${p.id}`
                }])) || []

                buttons.push([{ text: "💾 Simpan & Selesai", callback_data: `done:${targetUserId}` }])

                await editTelegramMessage(chatId, messageId, `🛠 **Atur Akses Proyek**\nUser: \`${targetUserId}\`\n\nKlik nama proyek untuk mengaktifkan/menonaktifkan:`, {
                    inline_keyboard: buttons
                })
            }

            // Callback Logic: toggle:[userId]:[projectId]
            if (data.startsWith('toggle:')) {
                const [_, targetUserId, projectId] = data.split(':')

                // Check if already exists
                const { data: exists } = await supabase
                    .from('telegram_user_projects')
                    .select('*')
                    .eq('telegram_id', targetUserId)
                    .eq('project_id', projectId)
                    .single()

                if (exists) {
                    const { error: delError } = await supabase.from('telegram_user_projects').delete().eq('telegram_id', targetUserId).eq('project_id', projectId)
                    if (delError) console.error('Supabase Delete Error:', delError)
                } else {
                    const { error: insError } = await supabase.from('telegram_user_projects').insert({ telegram_id: targetUserId, project_id: projectId })
                    if (insError) console.error('Supabase Insert Error:', insError)
                }

                // Update Menu
                const { data: projects } = await supabase.from('projects').select('id, name').order('name')
                const { data: allowed } = await supabase.from('telegram_user_projects').select('project_id').eq('telegram_id', targetUserId)
                const allowedIds = allowed?.map(a => a.project_id) || []

                const buttons = projects?.map(p => ([{
                    text: `${allowedIds.includes(p.id) ? '✅' : '❌'} ${p.name}`,
                    callback_data: `toggle:${targetUserId}:${p.id}`
                }])) || []

                buttons.push([{ text: "💾 Simpan & Selesai", callback_data: `done:${targetUserId}` }])

                await editTelegramMessage(chatId, messageId, `🛠 **Atur Akses Proyek**\nUser: \`${targetUserId}\`\n\nKlik nama proyek untuk mengaktifkan/menonaktifkan:`, {
                    inline_keyboard: buttons
                })
                await answerCallbackQuery(callbackQuery.id)
            }

            // Callback Logic: done:[userId]
            if (data.startsWith('done:')) {
                const targetUserId = data.split(':')[1]
                await editTelegramMessage(chatId, messageId, `✅ **Selesai!**\nUser \`${targetUserId}\` telah dikonfigurasi.`)
                await answerCallbackQuery(callbackQuery.id)

                // Notify the user
                await sendTelegramReply(Number(targetUserId), "🎉 **Akses Anda telah diaktifkan!**\nSilakan gunakan perintah `/project` untuk mulai.")
            }

            // Handle "Request Access" button from user
            if (data.startsWith('request_access:')) {
                const userId = callbackQuery.from.id
                const name = `${callbackQuery.from.first_name || ''} ${callbackQuery.from.last_name || ''}`.trim()

                // Find Admin
                const { data: admins } = await supabase.from('telegram_authorized_users').select('telegram_id').eq('is_admin', true)

                if (admins && admins.length > 0) {
                    for (const admin of admins) {
                        await sendTelegramReply(Number(admin.telegram_id), `📩 Permintaan Akses dari: *${name}*\nID: \`${userId}\``, {
                            inline_keyboard: [[{ text: "✅ Setujui & Atur Proyek", callback_data: `approve:${userId}` }]]
                        })
                    }
                    await answerCallbackQuery(callbackQuery.id, "📨 Permintaan terkirim ke Admin.")
                    await editTelegramMessage(chatId, messageId, `👋 **Halo!**\n\nPermintaan akses Anda telah dikirim ke Admin. Tunggu konfirmasi.`)
                } else {
                    await answerCallbackQuery(callbackQuery.id, "❌ Admin belum diset. Hubungi pengembang.")
                }
            }

            return NextResponse.json({ success: true })
        }

        // Basic validation of Telegram Update structure
        if (!update.message || !update.message.text) {
            return NextResponse.json({ message: 'No message content' }, { status: 200 })
        }

        const text = update.message.text as string
        const chatId = update.message.chat.id
        const userId = update.message.from?.id

        // --- AUTHORIZATION CHECK ---
        // We check if the sender (userId) is in the authorized list.
        // If not, we block all commands EXCEPT /start which is used to identify the ID.
        const { data: authUser, error: authError } = await supabase
            .from('telegram_authorized_users')
            .select('telegram_id, is_active, is_admin')
            .eq('telegram_id', userId)
            .single()

        const isAuthorized = authUser && authUser.is_active

        // Fetch allowed projects for this user
        const { data: allowedProjectsData } = await supabase
            .from('telegram_user_projects')
            .select('project_id')
            .eq('telegram_id', userId)

        const allowedProjectIds = allowedProjectsData?.map(p => p.project_id) || []

        // Case: /start command - Show Telegram ID
        if (text.startsWith('/start')) {
            let startMessage = `👋 **Halo!**\n\n`
            startMessage += `ID Telegram Anda adalah: \`${userId}\`\n\n`

            if (isAuthorized) {
                startMessage += `✅ Anda terdaftar sebagai pengguna **resmi**.\n`
                startMessage += `📊 Anda memiliki akses ke **${allowedProjectIds.length} proyek**.`
                await sendTelegramReply(chatId, startMessage)
            } else {
                startMessage += `⚠️ Anda **belum terdaftar** sebagai pengguna resmi.`
                await sendTelegramReply(chatId, startMessage, {
                    inline_keyboard: [[{ text: "🙋‍♂️ Minta Akses", callback_data: `request_access:${userId}` }]]
                })
            }

            return NextResponse.json({ success: true }, { status: 200 })
        }

        // Block unauthorized users from other commands
        if (!isAuthorized) {
            await sendTelegramReply(chatId, `🚫 **Akses Ditolak.**\n\nID \`${userId}\` belum terdaftar. Silakan hubungi admin untuk aktivasi akses.`)
            return NextResponse.json({ message: 'Unauthorized' }, { status: 200 })
        }

        // --- ADMIN COMMANDS ---
        if (text.startsWith('/manage') && authUser.is_admin) {
            const targetUserId = text.replace('/manage', '').trim()
            if (!targetUserId || isNaN(Number(targetUserId))) {
                await sendTelegramReply(chatId, "❓ **Gunakan Format:** `/manage ID_TELEGRAM_USER`")
                return NextResponse.json({ message: 'Invalid target ID' }, { status: 200 })
            }

            // Register user if not exists
            const { error: upsertError } = await supabase.from('telegram_authorized_users').upsert({
                telegram_id: targetUserId,
                name: `User ${targetUserId}`,
                is_active: true
            })

            if (upsertError) {
                console.error('Supabase Manage Upsert Error:', upsertError)
                await sendTelegramReply(chatId, "❌ Gagal memproses data di database.")
                return NextResponse.json({ success: true }, { status: 200 })
            }

            // Show Project Selection Menu
            const { data: projects } = await supabase.from('projects').select('id, name').order('name')
            const { data: allowed } = await supabase.from('telegram_user_projects').select('project_id').eq('telegram_id', targetUserId)
            const allowedIds = allowed?.map(a => a.project_id) || []

            const buttons = projects?.map(p => ([{
                text: `${allowedIds.includes(p.id) ? '✅' : '❌'} ${p.name}`,
                callback_data: `toggle:${targetUserId}:${p.id}`
            }])) || []

            buttons.push([{ text: "💾 Simpan & Selesai", callback_data: `done:${targetUserId}` }])

            await sendTelegramReply(chatId, `🛠 **Atur Akses Proyek**\nUser: \`${targetUserId}\`\n\nKlik nama proyek untuk mengaktifkan/menonaktifkan:`, {
                inline_keyboard: buttons
            })
            return NextResponse.json({ success: true }, { status: 200 })
        }

        // Case 1: /project command - List all projects
        if (text.startsWith('/project')) {
            let query = supabase
                .from('projects')
                .select('name')
                .order('name', { ascending: true })

            // Filter by allowed projects if not empty
            if (allowedProjectIds.length > 0) {
                query = query.in('id', allowedProjectIds)
            } else {
                await sendTelegramReply(chatId, '📭 **Akses Terbatas**: Anda belum ditugaskan ke proyek manapun. Hubungi admin.')
                return NextResponse.json({ message: 'No assigned projects' }, { status: 200 })
            }

            const { data: projects } = await query

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

            let query = supabase
                .from('projects')
                .select('id, name')
                .ilike('name', `%${projectName}%`)
                .limit(1)

            // Strictly filter by allowed projects
            query = query.in('id', allowedProjectIds)

            const { data: projects } = await query

            if (!projects || projects.length === 0) {
                await sendTelegramReply(chatId, `❌ **Akses Ditolak atau Tidak Ditemukan**: Anda tidak memiliki akses ke proyek "*${projectName}*" atau proyek tidak tersedia.`)
                return NextResponse.json({ message: 'Project not found/access denied' }, { status: 200 })
            }

            const projectDetails = await getProjectDetails(projects[0].id)

            // Calculate material ratio if possible (global ratio)
            const materialSummary = projectDetails.materialSummary || []
            let totalNeeded = 0
            let totalUsed = 0
            materialSummary.forEach((m: any) => {
                totalNeeded += m.quantity_needed || 0
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

        // 1. Find Project ID with access check
        let query = supabase
            .from('projects')
            .select('id, name')
            .ilike('name', `%${reportData.siteName}%`)
            .limit(1)

        // Strictly filter by allowed projects
        query = query.in('id', allowedProjectIds)

        const { data: projects } = await query

        let projectId = null
        if (projects && projects.length > 0) {
            projectId = projects[0].id
        }

        if (!projectId) {
            await sendTelegramReply(chatId, `❌ **Akses Ditolak atau Tidak Ditemukan**: Anda tidak memiliki akses untuk melaporkan proyek "*${reportData.siteName}*".`)
            return NextResponse.json({ message: 'Project access denied' }, { status: 200 })
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
