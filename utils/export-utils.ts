
/**
 * Utility to download data as CSV
 */
export function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(','))

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header]
            const escaped = ('' + val).replace(/"/g, '""')
            return `"${escaped}"`
        })
        csvRows.push(values.join(','))
    }

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Utility to trigger print
 */
export function triggerPrint() {
    window.print()
}
