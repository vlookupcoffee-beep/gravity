'use server'

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
    const reportDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    let message = `📊 **PROJECT STATUS REPORT**\n\n`;
    message += `🏗 **Project:** *${data.name}*\n`;
    message += `📈 **Progress:** \`${data.progress || 0}%\`\n`;
    message += `📅 **Date:** ${reportDate}\n`;
    message += `---------------------------\n\n`;

    const allowedCategories = [
        "3.3 Penanaman Tiang dan Pembuatan HH",
        "3.4 Penarikan Kabel Duct",
        "3.5 Joint dan Terminasi"
    ];

    if (data.powTasks?.length > 0) {
        message += `📍 **Execution Milestones:**\n`;
        data.powTasks.filter((t: any) => allowedCategories.includes(t.task_name)).forEach((t: any) => {
            message += `- ${t.task_name}: \`${t.progress}%\`\n`;
        });
        message += `\n`;
    }

    if (data.dailyReport) {
        message += `📝 **Daily Snapshot:**\n`;
        message += `*Activity Today:*\n${data.dailyReport.today_activity || '-'}\n\n`;
        message += `*Next Plan:*\n${data.dailyReport.tomorrow_plan || '-'}\n\n`;
    }

    if (data.materialSummary?.length > 0) {
        message += `📦 **Material Inventory (SISA):**\n`;
        data.materialSummary.forEach((m: any) => {
            const remaining = Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0));
            if (remaining > 0) {
                message += `- ${m.name}: \`${remaining}\` ${m.unit || ''}\n`;
            }
        });
    }

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
