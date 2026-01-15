/**
 * Utility to generate a pre-filled Telegram report template for a project.
 */
export function generateReportTemplate(projectName: string, materials: any[], distributionName?: string): string {
    let template = `📝 **FORMAT LAPORAN: ${projectName}**\n`;
    template += `Salin teks di bawah ini, isi datanya, lalu kirim kembali.\n\n`;

    template += `\`\`\`\n`;
    template += `/lapor\n`;
    template += `Site Name : ${projectName}\n`;
    template += `Distribusi : ${distributionName || ''}\n`;
    template += `Man Power : \n`;
    template += `Executor : \n`;
    template += `Waspang : \n`;
    template += `Today Activity : \n`;
    template += `Tomorrow Plan : \n\n`;

    template += `SOW :\n`;

    if (materials && materials.length > 0) {
        materials.forEach(m => {
            // Format: Name : Scope/Total/Today
            // We use 0 for today since it's a new report
            template += `${m.name} : ${m.quantity_needed || 0}/${m.total_out || 0}/0\n`;
        });
    } else {
        template += `[Daftar Material] : 0/0/0\n`;
    }

    template += `\nPerizinan :\n`;
    template += `Kelurahan : 0/0/0\n`;
    template += `PU (jika ada) : 0/0/0\n`;
    template += `RW : 0/0/0\n`;
    template += `RT : 0/0/0\n`;

    template += `\`\`\``;

    return template;
}
