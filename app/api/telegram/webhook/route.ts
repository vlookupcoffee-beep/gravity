import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseTelegramMessage } from '@/utils/telegram-parser'
import { syncPowProgressWithMaterials } from '@/app/actions/pow-sync-actions'
import { getProjectDetails } from '@/app/actions/get-project-details'
import { formatProjectReport } from '@/app/actions/telegram-actions'
import { getProjectMaterialSummary, getAvailableDistributions } from '@/app/actions/material-actions'
import { generateReportTemplate } from '@/utils/telegram-format'

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

            // Callback Logic: approve_lapor:[reportId]
            if (data.startsWith('approve_lapor:')) {
                const reportId = data.split(':')[1]

                // Fetch report details
                const { data: report, error: fetchError } = await supabase
                    .from('daily_reports')
                    .select('*, projects(name)')
                    .eq('id', reportId)
                    .single()

                if (fetchError || !report) {
                    await answerCallbackQuery(callbackQuery.id, "❌ Laporan tidak ditemukan.")
                    return NextResponse.json({ success: true })
                }

                if (report.status !== 'PENDING') {
                    await answerCallbackQuery(callbackQuery.id, "⚠️ Laporan sudah diproses.")
                    return NextResponse.json({ success: true })
                }

                // Update status
                await supabase.from('daily_reports').update({ status: 'APPROVED' }).eq('id', reportId)

                // Process stock deduction
                const { data: reportItems } = await supabase.from('daily_report_items').select('*').eq('report_id', reportId)
                let updatedItemsCount = 0

                if (reportItems) {
                    for (const item of reportItems) {
                        if (item.material_id && item.quantity_today > 0) {
                            // Transaction OUT
                            await supabase.from('material_transactions').insert({
                                material_id: item.material_id,
                                project_id: report.project_id,
                                transaction_type: 'OUT',
                                quantity: item.quantity_today,
                                distribution_name: report.distribusi_name,
                                notes: `Approved Report: ${report.projects?.name} - ${item.material_name_snapshot}`
                            })

                            // Update Stock
                            const { data: currentMat } = await supabase.from('materials').select('current_stock').eq('id', item.material_id).single()
                            if (currentMat) {
                                await supabase.from('materials').update({
                                    current_stock: (currentMat.current_stock || 0) - item.quantity_today
                                }).eq('id', item.material_id)
                            }
                            updatedItemsCount++
                        }
                    }
                }

                // --- OPTION 2: MILESTONE SELECTION ---
                const { data: milestones } = await supabase
                    .from('pow_tasks')
                    .select('id, task_name')
                    .eq('project_id', report.project_id)
                    .lt('progress', 100)
                    .order('order_index')

                const milestoneButtons = milestones?.map(m => ([{
                    text: `📍 ${m.task_name}`,
                    callback_data: `ms_upd:${report.project_id}:${m.id}:${reportId}`
                }])) || []

                milestoneButtons.push([{ text: "🏁 Selesai & Tutup", callback_data: `ms_done:${reportId}` }])

                await answerCallbackQuery(callbackQuery.id, "✅ Laporan Disetujui!")
                await editTelegramMessage(chatId, messageId,
                    `✅ **LAPORAN DISETUJUI**\n\n` +
                    `Project: *${report.projects?.name}*\n` +
                    `Distribusi: *${report.distribusi_name || '-'}*\n\n` +
                    `Status: \`APPROVED\`\n` +
                    `Stock updated for ${updatedItemsCount} items.\n\n` +
                    `💡 **Milestone selesai hari ini?**\n` +
                    `(Klik untuk tandai 100%)`,
                    { inline_keyboard: milestoneButtons }
                )

                // Notify original sender if we had their ID (we don't store it in daily_reports yet, but we could if we wanted to)
                // For now, just finish.
            }

            // Callback Logic: reject_lapor:[reportId]
            if (data.startsWith('reject_lapor:')) {
                const reportId = data.split(':')[1]

                const { data: report } = await supabase.from('daily_reports').select('*, projects(name)').eq('id', reportId).single()
                if (!report) return NextResponse.json({ success: true })

                await supabase.from('daily_reports').update({ status: 'REJECTED' }).eq('id', reportId)

                await answerCallbackQuery(callbackQuery.id, "❌ Laporan Ditolak.")
                await editTelegramMessage(chatId, messageId, `❌ **LAPORAN DITOLAK**\n\nProject: *${report.projects?.name}*\n\nStatus: \`REJECTED\``)
            }

            // Callback Logic: ms_upd:[projectId]:[taskId]:[reportId]
            if (data.startsWith('ms_upd:')) {
                const [_, projectId, taskId, reportId] = data.split(':')

                // Update Milestone
                await supabase.from('pow_tasks').update({ progress: 100, status: 'completed' }).eq('id', taskId)

                // Force sync project progress percentage
                await syncPowProgressWithMaterials(projectId)

                // Re-fetch remaining for buttons
                const { data: milestones } = await supabase
                    .from('pow_tasks')
                    .select('id, task_name')
                    .eq('project_id', projectId)
                    .lt('progress', 100)
                    .order('order_index')

                const { data: report } = await supabase.from('daily_reports').select('*, projects(name)').eq('id', reportId).single()

                const milestoneButtons = milestones?.map(m => ([{
                    text: `📍 ${m.task_name}`,
                    callback_data: `ms_upd:${projectId}:${m.id}:${reportId}`
                }])) || []

                milestoneButtons.push([{ text: "🏁 Selesai & Tutup", callback_data: `ms_done:${reportId}` }])

                await answerCallbackQuery(callbackQuery.id, "📍 Milestone Updated!")
                await editTelegramMessage(chatId, messageId,
                    `✅ **LAPORAN DISETUJUI**\n\n` +
                    `Project: *${report?.projects?.name}*\n` +
                    `Distribusi: *${report?.distribusi_name || '-'}*\n\n` +
                    `Status: \`APPROVED\`\n\n` +
                    `💡 **Milestone selesai hari ini?**\n` +
                    `(Klik untuk tandai 100%)`,
                    { inline_keyboard: milestoneButtons }
                )
            }

            // Callback Logic: ms_done:[reportId]
            if (data.startsWith('ms_done:')) {
                const reportId = data.split(':')[1]
                const { data: report } = await supabase.from('daily_reports').select('*, projects(name)').eq('id', reportId).single()

                await answerCallbackQuery(callbackQuery.id, "✅ Selesai!")
                await editTelegramMessage(chatId, messageId,
                    `✅ **LAPORAN DISETUJUI**\n\n` +
                    `Project: *${report?.projects?.name}*\n` +
                    `Distribusi: *${report?.distribusi_name || '-'}*\n\n` +
                    `Status: \`APPROVED\`\n\n` +
                    `✨ Semua milestone hari ini telah dicatat.`
                )
            }

            // --- RESTORED ORIGINAL CALLBACKS ---

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

            // Callback Logic: dist:[projectId]:[distName]
            if (data.startsWith('dist:')) {
                const [_, projectId, distName] = data.split(':')
                const projectDetails = await getProjectDetails(projectId)

                // Get Distribution Summary
                const summary = await getProjectMaterialSummary(projectId, distName || undefined)

                let msg = `📊 **MATERIAL: ${projectDetails.name}**\n`
                msg += `📍 **BREAKDOWN: ${distName ? distName.toUpperCase() : 'TOTAL PROJECT'}**\n\n`

                summary.forEach((m: any) => {
                    const usage = m.quantity_needed > 0 ? Math.min(100, Math.round((m.total_out / m.quantity_needed) * 100)) : 0;
                    if (usage === 0) return;
                    msg += `\n🔸 **${m.name}**\n`
                    msg += `\`KEB: ${m.quantity_needed} | MSK: ${m.total_in}\`\n`
                })

                msg += `\n💡 *Sisa = Masuk - Terpakai*`

                // Get all dists for buttons
                const dists = await getAvailableDistributions(projectId)
                const buttons = []

                // Add "TOTAL" button
                if (distName !== '') {
                    buttons.push([{ text: "📋 LIHAT TOTAL", callback_data: `dist:${projectId}:` }])
                }

                // Add other dist buttons in grid (max 3 per row)
                const otherDists = dists.filter((d: string) => d !== distName)
                for (let i = 0; i < otherDists.length; i += 3) {
                    const row = otherDists.slice(i, i + 3).map((d: string) => ({
                        text: `📦 ${d.toUpperCase()}`,
                        callback_data: `dist:${projectId}:${d}`
                    }))
                    buttons.push(row)
                }

                await editTelegramMessage(chatId, messageId, msg, {
                    inline_keyboard: buttons
                })
                await answerCallbackQuery(callbackQuery.id)
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

            // Callback Logic: format_lapor:[projectId]
            if (data.startsWith('format_lapor:')) {
                const projectId = data.split(':')[1]
                const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()

                if (!project) {
                    await answerCallbackQuery(callbackQuery.id, "❌ Proyek tidak ditemukan.")
                    return NextResponse.json({ success: true })
                }

                const summary = await getProjectMaterialSummary(projectId)
                const template = generateReportTemplate(project.name, summary)

                await sendTelegramReply(chatId, template)
                await answerCallbackQuery(callbackQuery.id)
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
        const messageId = update.message.message_id

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
        // IF USER IS ADMIN: Allow ALL projects automatically ("All Role Open")
        let allowedProjectIds: string[] = []

        if (authUser?.is_admin) {
            const { data: allProjects } = await supabase.from('projects').select('id')
            allowedProjectIds = allProjects?.map(p => p.id) || []
        } else {
            const { data: allowedProjectsData } = await supabase
                .from('telegram_user_projects')
                .select('project_id')
                .eq('telegram_id', userId)
            allowedProjectIds = allowedProjectsData?.map(p => p.project_id) || []
        }

        // Case: /start command - Show Telegram ID & Help
        if (text.startsWith('/start')) {
            let startMessage = `👋 **Halo!**\n\n`
            startMessage += `ID Telegram Anda adalah: \`${userId}\`\n\n`

            if (isAuthorized) {
                startMessage += `✅ Anda terdaftar sebagai pengguna **resmi**.\n`
                startMessage += `📊 Anda memiliki akses ke **${allowedProjectIds.length} proyek**.\n\n`

                startMessage += `🚀 **PERINTAH UTAMA:**\n`
                startMessage += `• \`/project\` - Tabel daftar proyek milik Anda.\n`
                startMessage += `• \`/status [Proyek]\` - Detail progres Proyek.\n`
                startMessage += `• \`/material [Proyek]\` - Stok material & distribusi.\n`
                startMessage += `• \`/lapor\` - Pilih proyek dan dapatkan format laporan.\n`
                startMessage += `• \`/lapor [Proyek]\` - Langsung ambil format laporan proyek.\n\n`

                startMessage += `📝 **FORMAT LAPOR SINGKAT:**\n`
                startMessage += `(Salin, isi, lalu kirim kembali ke bot)\n`
                startMessage += `\`\`\`\n`
                startMessage += `/lapor\n`
                startMessage += `Site Name : [Nama Proyek]\n`
                startMessage += `Man Power : [Jumlah]\n`
                startMessage += `Executor : [Nama]\n`
                startMessage += `Waspang : [Nama]\n`
                startMessage += `Today Activity : [Kegiatan]\n`
                startMessage += `Tomorrow Plan : [Rencana]\n\n`
                startMessage += `[Material] : [HariIni]/[Total]/[Scope]\n`
                startMessage += `\`\`\`\n\n`

                startMessage += `✨ **FITUR BARU: APPROVE & MILESTONE**\n`
                startMessage += `Saat Admin menyetujui laporan:\n`
                startMessage += `1. Klik tombol **✅ Approve**\n`
                startMessage += `2. Bot akan menampilkan tombol Milestone (Kick Off, Survey, dll)\n`
                startMessage += `3. Klik milestone yang selesai untuk tandai 100% secara instan.\n\n`

                startMessage += `🚀 **AUTO-UPDATE PoW (OTOMATIS):**\n`
                startMessage += `Sistem akan otomatis 100% jika isi *Today Activity* mengandung:\n`
                startMessage += `• **Kick Off** / **KOM**\n`
                startMessage += `• **Survey** / **Aanwijzing**\n`
                startMessage += `• **Ijin** / **Permit** / **Perijinan**\n`
                startMessage += `• **DRM** / **Design Review**\n`
                startMessage += `• **ABD** / **Submit ABD**\n`
                startMessage += `• **ATP** / **BAST**\n\n`
                startMessage += `📦 *Material & Delivery juga otomatis terupdate dari laporan.*`

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

        // --- ADMIN/OWNER ONLY COMMANDS ---
        if (authUser.is_admin) {
            // Command: /exp [Project] [Amount] [Description]
            // Example: /exp SKRJ 100000 Beli bensin
            if (text.startsWith('/exp')) {
                const rawContent = text.replace('/exp', '').trim()
                const parts = rawContent.split(/\s+/) // Support multiple spaces

                if (parts.length < 1 || (parts.length === 1 && !/\d/.test(parts[0]))) {
                    await sendTelegramReply(chatId, "❓ **Gunakan Format:** `/exp [Project] [Nominal] [Deskripsi]`\nAtau: `/exp [Nominal] [Deskripsi]`\n\nContoh: `/exp SKRJ 50000 Beli bensin`")
                    return NextResponse.json({ success: true }, { status: 200 })
                }

                let amountStr = ""
                let amount = 0
                let amountIndex = -1
                let projectId = null
                let matchedProjectName = "Umum/Overhead"

                // 1. Find the first part that contains digits (the amount)
                for (let i = 0; i < parts.length; i++) {
                    const cleaned = parts[i].replace(/[^0-9]/g, '')
                    if (cleaned !== "" && !isNaN(Number(cleaned))) {
                        amountStr = cleaned
                        amount = Number(cleaned)
                        amountIndex = i
                        break
                    }
                }

                if (amountIndex === -1 || amount <= 0) {
                    await sendTelegramReply(chatId, "❌ **Nominal tidak valid.** Gunakan angka saja sebagai nominal.")
                    return NextResponse.json({ success: true }, { status: 200 })
                }

                // 2. Identify Project Name (everything before the amount)
                const potentialProjectName = parts.slice(0, amountIndex).join(' ').trim()
                if (potentialProjectName) {
                    const { data: projects } = await supabase
                        .from('projects')
                        .select('id, name')
                        .ilike('name', `%${potentialProjectName}%`)
                        .limit(1)

                    if (projects && projects.length > 0) {
                        projectId = projects[0].id
                        matchedProjectName = projects[0].name
                    } else {
                        // If project name was provided but not found, we still use it as part of description if you want,
                        // but for now let's just treat it as matched failed and keep it as Overhead or notify?
                        // Let's just keep matchedProjectName as "Not Found" to give feedback
                        matchedProjectName = `[?] ${potentialProjectName} (Tidak ditemukan)`
                    }
                }

                // 3. Identify Description (everything after the amount)
                const description = parts.slice(amountIndex + 1).join(' ').trim() || 'No description'

                const { error: expError } = await supabase.from('expenses').insert({
                    project_id: projectId,
                    amount: amount,
                    description: description,
                    category: projectId ? 'Proyek' : 'Lainnya',
                    created_by: userId,
                    date: new Date().toISOString().split('T')[0]
                })

                if (expError) {
                    await sendTelegramReply(chatId, `❌ **Gagal mencatat:**\n${expError.message}`)
                } else {
                    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
                    await sendTelegramReply(chatId, `✅ **Pengeluaran Tercatat!**\n\n📌 Proyek: *${matchedProjectName}*\n💵 Nominal: *${formattedAmount}*\n📝 Catatan: _${description}_`)
                }
                return NextResponse.json({ success: true }, { status: 200 })
            }

            // Command: /billing
            // Show milestones that are triggered but not yet paid
            if (text.startsWith('/billing')) {
                const { data: milestones, error: billError } = await supabase
                    .from('project_payment_milestones')
                    .select('*, projects(name)')
                    .eq('is_paid', false)

                if (billError) {
                    await sendTelegramReply(chatId, "❌ Gagal mengambil data tagihan.")
                    return NextResponse.json({ success: true }, { status: 200 })
                }

                if (!milestones || milestones.length === 0) {
                    await sendTelegramReply(chatId, "📭 **Tidak ada tagihan** yang menunggu saat ini.")
                    return NextResponse.json({ success: true }, { status: 200 })
                }

                // Note: Real-time progress check is hard here without full calculation logic
                // For simplified bot view, we just list all unpaid milestones
                let billMsg = `💰 **DAFTAR TAGIHAN (BELUM CAIR)**\n\n`
                milestones.forEach((m: any, idx: number) => {
                    const amt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(m.amount)
                    billMsg += `${idx + 1}. *${m.projects?.name}*\n   📌 ${m.label} (${m.percentage}%)\n   💵 *${amt}*\n\n`
                })
                billMsg += `💡 *Cek detail di Dashboard Web untuk status progres.*`

                await sendTelegramReply(chatId, billMsg)
                return NextResponse.json({ success: true }, { status: 200 })
            }

            // Existing /manage command
            if (text.startsWith('/manage')) {
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
                await sendTelegramReply(chatId, '❓ **Gunakan Format:** `/status NAMA PROJECT` atau `/status all`')
                return NextResponse.json({ message: 'Missing project name' }, { status: 200 })
            }

            // --- SUB-CASE: /status all ---
            if (projectName.toLowerCase() === 'all') {
                let query = supabase
                    .from('projects')
                    .select('id, name, progress, status')
                    .order('name', { ascending: true })

                // Strictly filter by allowed projects
                if (allowedProjectIds.length > 0) {
                    query = query.in('id', allowedProjectIds)
                } else {
                    await sendTelegramReply(chatId, '📭 **Akses Terbatas**: Anda belum memiliki akses ke proyek manapun.')
                    return NextResponse.json({ success: true })
                }

                const { data: allProjects, error: fetchError } = await query
                if (fetchError || !allProjects) {
                    await sendTelegramReply(chatId, '❌ Gagal mengambil data proyek.')
                    return NextResponse.json({ success: true })
                }

                let statusAllMsg = `📊 **STATUS SEMUA PROYEK**\n\n`
                allProjects.forEach((p: any, idx: number) => {
                    const dots = Math.round((p.progress || 0) / 10)
                    const bar = '🟦'.repeat(dots) + '⬜'.repeat(10 - dots)
                    statusAllMsg += `${idx + 1}. *${p.name}*\n`
                    statusAllMsg += `   📈 Progres: \`${p.progress || 0}%\`\n`
                    statusAllMsg += `   📌 Status: \`${p.status || '-'}\`\n`
                    statusAllMsg += `   [${bar}]\n\n`
                })

                if (allProjects.length === 0) {
                    statusAllMsg = '📭 **Tidak ada proyek** yang terdaftar.'
                }

                await sendTelegramReply(chatId, statusAllMsg)
                return NextResponse.json({ success: true }, { status: 200 })
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

        // Case 3: /material command
        if (text.startsWith('/material')) {
            const projectName = text.replace('/material', '').trim()

            if (!projectName) {
                await sendTelegramReply(chatId, '❓ **Gunakan Format:** `/material NAMA PROJECT`')
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

            const projectId = projects[0].id
            const projectDetails = await getProjectDetails(projectId)
            const summary = await getProjectMaterialSummary(projectId)
            const dists = await getAvailableDistributions(projectId)

            let msg = `📊 **MATERIAL: ${projectDetails.name}**\n`
            msg += `📍 **TOTAL PROJECT**\n\n`

            summary.forEach((m: any) => {
                const sisa = m.total_in - m.total_out
                const usage = m.quantity_needed > 0 ? Math.min(100, Math.round((m.total_out / m.quantity_needed) * 100)) : 0;
                if (usage === 0 && m.total_in === 0) return; // Hide if no usage and no stock arrived

                msg += `\n🔸 **${m.name}**\n`
                msg += `\`KEB: ${m.quantity_needed} | MSK: ${m.total_in} | TPK: ${m.total_out} | SIS: ${sisa}\`\n`
            })

            msg += `\n💡 *Gunakan tombol di bawah untuk breakdown per distribusi.*`

            const distButtons = []
            for (let i = 0; i < dists.length; i += 3) {
                const row = dists.slice(i, i + 3).map((d: string) => ({
                    text: `📦 ${d.toUpperCase()}`,
                    callback_data: `dist:${projectId}:${d}`
                }))
                distButtons.push(row)
            }

            await sendTelegramReply(chatId, msg, {
                inline_keyboard: distButtons
            })
            return NextResponse.json({ success: true }, { status: 200 })
        }

        // Case 2: /lapor command
        if (text.startsWith('/lapor')) {
            const commandPart = text.split(/\s+/)[0];
            const content = text.slice(commandPart.length).trim();

            // Sub-case A: Just /lapor or /lapor@botname -> Show Project Buttons
            if (!content) {
                let query = supabase
                    .from('projects')
                    .select('id, name')
                    .order('name', { ascending: true })

                if (allowedProjectIds.length > 0) {
                    query = query.in('id', allowedProjectIds)
                }

                const { data: projects } = await query

                if (!projects || projects.length === 0) {
                    await sendTelegramReply(chatId, '📭 **Akses Terbatas**: Anda belum ditugaskan ke proyek manapun.')
                    return NextResponse.json({ success: true })
                }

                const buttons = projects.map(p => ([{
                    text: `📝 ${p.name}`,
                    callback_data: `format_lapor:${p.id}`
                }]))

                await sendTelegramReply(chatId, '💡 **SILAKAN PILIH PROYEK**\nKlik tombol di bawah untuk mendapatkan format laporan yang sesuai:', {
                    inline_keyboard: buttons
                })
                return NextResponse.json({ success: true })
            }

            // Sub-case B: /lapor [ProjectName] (but not full report) -> Give Template
            // We check if content is short and doesn't contain standard report markers
            const isFullReport = content.toLowerCase().includes('site name') || content.includes('\n');

            if (!isFullReport) {
                const projectName = content;
                let query = supabase
                    .from('projects')
                    .select('id, name')
                    .ilike('name', `%${projectName}%`)
                    .limit(1)

                query = query.in('id', allowedProjectIds)

                const { data: projects } = await query

                if (!projects || projects.length === 0) {
                    await sendTelegramReply(chatId, `❌ **Proyek Tidak Ditemukan**: "${projectName}"`)
                    return NextResponse.json({ success: true })
                }

                const project = projects[0];
                const summary = await getProjectMaterialSummary(project.id)
                const template = generateReportTemplate(project.name, summary)

                await sendTelegramReply(chatId, template)
                return NextResponse.json({ success: true })
            }

            // Sub-case C: /lapor [Full Report Content] -> Proceed to parsing below
        } else {
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
                distribusi_name: reportData.distribusi,
                manpower_count: reportData.manpower,
                executor_name: reportData.executor,
                waspang_name: reportData.waspang,
                today_activity: reportData.todayActivity,
                tomorrow_plan: reportData.tomorrowPlan,
                raw_message: text,
                status: 'PENDING'
            })
            .select()
            .single()

        if (reportError) {
            console.error('Error creating report:', reportError)
            await sendTelegramReply(chatId, `❌ **System Error**: Gagal menyimpan laporan. \n${reportError.message}`)
            return NextResponse.json({ error: reportError.message }, { status: 500 })
        }

        // --- SYNC POW ON SUBMISSION (for keyword-based tasks) ---
        await syncPowProgressWithMaterials(projectId)

        // 3. Process Items
        for (const item of reportData.items) {
            const searchName = item.rawName.split('(')[0].trim()

            let materialId = null
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
                quantity_today: item.todayDone,
                category: 'SOW'
            })
        }

        // 3b. Process Permits
        for (const permit of reportData.permits) {
            await supabase.from('daily_report_items').insert({
                report_id: report.id,
                material_id: null,
                material_name_snapshot: permit.rawName,
                quantity_scope: permit.scope,
                quantity_total: permit.totalDone,
                quantity_today: permit.todayDone,
                category: 'PERMIT'
            })
        }

        // 4. Notify Admins for Approval
        const { data: admins } = await supabase.from('telegram_authorized_users').select('telegram_id').eq('is_admin', true)

        const senderName = update.message.from?.first_name || 'User'
        let adminMsg = `📥 **LAPORAN BARU PERLU APPROVAL**\n\n`
        adminMsg += `👤 Dari: *${senderName}* (\`${userId}\`)\n`
        adminMsg += `📍 Project: *${projects?.[0]?.name}*\n`
        adminMsg += `📦 Distribusi: *${reportData.distribusi || '-'}*\n`
        adminMsg += `👷 Manpower: \`${reportData.manpower}\`\n\n`
        adminMsg += `🛠 **Items:**\n`
        reportData.items.forEach(it => {
            if (it.todayDone > 0) {
                adminMsg += `• ${it.rawName}: \`${it.todayDone}\`\n`
            }
        })

        if (reportData.permits && reportData.permits.length > 0) {
            adminMsg += `\n📑 **Perizinan:**\n`
            reportData.permits.forEach(it => {
                // Always show permits progress if scope > 0 or done > 0, or just if todayDone > 0?
                // User wants to see report. "Breakdown ... sama seperti laporan progres".
                // In progress report (adminMsg above), we only show items with todayDone > 0.
                // But for permits, maybe we want to see status even if 0 today?
                // Let's stick to consistent behavior: show if today > 0, OR maybe show all if it's permits?
                // Let's show if today > 0 for now to keep it concise, or maybe check user intent.
                // User said "breakdown ... sama seperti laporan progres", so mimicking behavior.
                if (it.todayDone > 0) {
                    adminMsg += `• ${it.rawName}: \`${it.todayDone}\`\n`
                }
            })
        }

        const buttons = {
            inline_keyboard: [[
                { text: "✅ Approve", callback_data: `approve_lapor:${report.id}` },
                { text: "❌ Reject", callback_data: `reject_lapor:${report.id}` }
            ]]
        }

        if (admins) {
            for (const admin of admins) {
                await sendTelegramReply(Number(admin.telegram_id), adminMsg, buttons)
            }
        }

        // Success Reply to User
        await sendTelegramReply(chatId, `✅ **Laporan Terkirim!**\n\nLaporan Anda sedang menunggu persetujuan Admin/Owner. Anda akan melihat update di web setelah disetujui.\n\nProject: *${projects?.[0]?.name}*\nDistribusi: *${reportData.distribusi || '-'}*`)

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
