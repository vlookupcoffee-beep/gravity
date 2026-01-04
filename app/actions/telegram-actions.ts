'use server'

export async function formatProjectReport(data: any) {
    const reportDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    let message = `📊 **LAPORAN TEKNIS PROYEK**\n\n`;
    message += `🏗 **Proyek:** *${data.name}*\n`;
    message += `📈 **Progres Global:** \`${data.progress || 0}%\` (Fisik)\n`;
    message += `🏗 **Progres Sipil:** \`${data.materialRatio || 0}%\` (Material)\n`;
    message += `📝 **Aktivitas:** \`${data.reportCount || 0} Laporan Terarsip\`\n`;
    message += `📅 **Tanggal:** ${reportDate}\n`;
    message += `---------------------------\n\n`;

    const allowedCategories = [
        "3.3 Penanaman Tiang dan Pembuatan HH",
        "3.4 Penarikan Kabel Duct",
        "3.5 Joint dan Terminasi"
    ];

    if (data.powTasks?.length > 0) {
        message += `📍 **Tahapan Eksekusi:**\n`;
        data.powTasks.filter((t: any) => allowedCategories.includes(t.task_name)).forEach((t: any) => {
            const dots = Math.round(t.progress / 10);
            const bar = '🟦'.repeat(dots) + '⬜'.repeat(10 - dots);
            message += `- ${t.task_name}: \`${t.progress}%\`\n  [${bar}]\n`;
        });
        message += `\n`;
    }

    if (data.materialSummary?.length > 0) {
        message += `📦 **PROGRES MATERIAL (PAKAI/BUTUH):**\n`;
        data.materialSummary.forEach((m: any) => {
            const usage = m.quantity_needed > 0 ? Math.min(100, Math.round((m.total_out / m.quantity_needed) * 100)) : 0;
            const dots = Math.round(usage / 10);
            const bar = '🟦'.repeat(dots) + '⬜'.repeat(10 - dots);
            message += `- ${m.name}: \`${usage}%\`\n  [${bar}]\n`;
        });
        message += `\n`;
        if (data.materialRatio) {
            message += `💡 **Rasio Penggunaan:** \`${data.materialRatio}% Terdistribusi\`\n\n`;
        }
    }

    if (data.dailyReport) {
        message += `📝 **Update Harian:**\n`;
        message += `*Hari Ini:* ${data.dailyReport.today_activity || '-'}\n`;
        message += `*Besok:* ${data.dailyReport.tomorrow_plan || '-'}\n\n`;
    }

    return message;
}

export async function sendTelegramReport(data: any, target: 'private' | 'group') {
    const token = process.env.BOT_TELEGRAM_TOKEN;
    const privateId = process.env.TELEGRAM_PRIVATE_ID;
    const groupId = process.env.TELEGRAM_GROUP_ID;

    const chatId = target === 'private' ? privateId : groupId;

    if (!token) {
        throw new Error('Telegram Bot Token (BOT_TELEGRAM_TOKEN) is not configured in .env');
    }

    if (!chatId) {
        throw new Error(`Telegram Chat ID for ${target} is not configured in .env. Please set TELEGRAM_${target === 'private' ? 'PRIVATE' : 'GROUP'}_ID`);
    }

    // Format the report
    const message = await formatProjectReport(data);

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.description || 'Failed to send Telegram message');
        }

        return { success: true };
    } catch (err: any) {
        console.error('Telegram Action Error:', err);
        throw new Error(err.message || 'Failed to connect to Telegram API');
    }
}
