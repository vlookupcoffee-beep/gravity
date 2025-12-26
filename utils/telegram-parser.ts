export interface ParsedReport {
    siteName: string | null;
    manpower: number;
    executor: string | null;
    waspang: string | null;
    items: ParsedItem[];
    todayActivity: string | null;
    tomorrowPlan: string | null;
}

export interface ParsedItem {
    rawName: string;
    scope: number;
    totalDone: number;
    todayDone: number;
}

export function parseTelegramMessage(text: string): ParsedReport {
    const lines = text.split('\n');

    const report: ParsedReport = {
        siteName: null,
        manpower: 0,
        executor: null,
        waspang: null,
        items: [],
        todayActivity: null,
        tomorrowPlan: null
    };

    let parsingItems = false;
    let activityBuffer: string[] = [];
    let planBuffer: string[] = [];
    let currentSection: 'header' | 'sow' | 'activity' | 'plan' = 'header';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect Sections
        if (trimmed.toLowerCase().includes('sow :')) {
            currentSection = 'sow';
            continue;
        }
        if (trimmed.toLowerCase().startsWith('today activity')) {
            currentSection = 'activity';
            // Extract content on same line if exists
            const content = trimmed.split(':')[1]?.trim();
            if (content) activityBuffer.push(content);
            continue;
        }
        if (trimmed.toLowerCase().startsWith('tommorow plan') || trimmed.toLowerCase().startsWith('tomorrow plan')) {
            currentSection = 'plan';
            const content = trimmed.split(':')[1]?.trim();
            if (content) planBuffer.push(content);
            continue;
        }

        // Parse Content based on Section
        if (currentSection === 'header') {
            if (trimmed.toLowerCase().startsWith('site name')) report.siteName = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('manpower')) {
                const match = trimmed.match(/(\d+)/);
                if (match) report.manpower = parseInt(match[1]);
            }
            if (trimmed.toLowerCase().startsWith('executor')) report.executor = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('waspang')) report.waspang = trimmed.split(':')[1]?.trim() || null;
        }
        else if (currentSection === 'sow') {
            // Format: Name (Code): Qty/Done/Today
            // Example: NP-7.0-140-3S (TIANG 3S):123/0/0
            const parts = trimmed.split(':');
            if (parts.length >= 2) {
                const namePart = parts[0].trim();
                const numbersPart = parts[1].trim(); // 123/0/0

                const nums = numbersPart.split('/').map(n => parseFloat(n.trim()));
                if (nums.length === 3) {
                    report.items.push({
                        rawName: namePart,
                        scope: nums[0] || 0,
                        totalDone: nums[1] || 0,
                        todayDone: nums[2] || 0
                    });
                }
            }
        }
        else if (currentSection === 'activity') {
            if (!trimmed.toLowerCase().startsWith('today activity')) { // Avoid re-adding header
                activityBuffer.push(trimmed);
            }
        }
        else if (currentSection === 'plan') {
            if (!trimmed.toLowerCase().startsWith('tommorow plan') && !trimmed.toLowerCase().startsWith('tomorrow plan')) {
                planBuffer.push(trimmed);
            }
        }
    }

    report.todayActivity = activityBuffer.join('\n');
    report.tomorrowPlan = planBuffer.join('\n');

    return report;
}
