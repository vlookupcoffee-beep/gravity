export interface ParsedReport {
    siteName: string | null;
    distribusi: string | null;
    manpower: number;
    executor: string | null;
    waspang: string | null;
    items: ParsedItem[];
    permits: ParsedItem[];
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
        distribusi: null,
        manpower: 0,
        executor: null,
        waspang: null,
        items: [],
        permits: [],
        todayActivity: null,
        tomorrowPlan: null
    };

    let activityBuffer: string[] = [];
    let planBuffer: string[] = [];
    let currentSection: 'header' | 'sow' | 'permits' | 'activity' | 'plan' = 'header';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect Sections
        if (trimmed.toLowerCase().includes('sow :')) {
            currentSection = 'sow';
            continue;
        }
        if (trimmed.toLowerCase().includes('perizinan :')) {
            currentSection = 'permits';
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
            if (trimmed.toLowerCase().startsWith('distribusi')) report.distribusi = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('manpower')) {
                const match = trimmed.match(/(\d+)/);
                if (match) report.manpower = parseInt(match[1]);
            }
            if (trimmed.toLowerCase().startsWith('executor')) report.executor = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('waspang')) report.waspang = trimmed.split(':')[1]?.trim() || null;
        }
        else if (currentSection === 'sow' || currentSection === 'permits') {
            // Format: Name (Code): Qty/Done/Today
            // Example: NP-7.0-140-3S (TIANG 3S):123/0/0
            // Example Permit: Kelurahan : 1/0/0
            const parts = trimmed.split(':');
            if (parts.length >= 2) {
                const namePart = parts[0].trim();
                const numbersPart = parts[1].trim(); // 123/0/0

                const nums = numbersPart.split('/').map(n => parseFloat(n.trim()));
                if (nums.length === 3) {
                    const item: ParsedItem = {
                        rawName: namePart,
                        scope: nums[0] || 0,
                        totalDone: nums[1] || 0,
                        todayDone: nums[2] || 0
                    };

                    if (currentSection === 'sow') {
                        report.items.push(item);
                    } else {
                        report.permits.push(item);
                    }
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

export interface ParsedMaterialInput {
    projectName: string | null;
    items: ParsedItem[];
    distribution: string | null;
    date: string | null;
}

export function parseMaterialInput(text: string): ParsedMaterialInput {
    const lines = text.split('\n');
    const input: ParsedMaterialInput = {
        projectName: null,
        items: [],
        distribution: null,
        date: null
    };

    let currentSection: 'header' | 'items' = 'header';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.toLowerCase().includes('list material :')) {
            currentSection = 'items';
            continue;
        }

        if (currentSection === 'header') {
            if (trimmed.toLowerCase().startsWith('project')) input.projectName = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('distribusi')) input.distribution = trimmed.split(':')[1]?.trim() || null;
            if (trimmed.toLowerCase().startsWith('tanggal')) input.date = trimmed.split(':')[1]?.trim() || null;
        } else if (currentSection === 'items') {
            // Format: Material Name : Quantity
            const parts = trimmed.split(':');
            if (parts.length >= 2) {
                const namePart = parts[0].trim();
                const qtyPart = parseFloat(parts[1].trim());

                if (!isNaN(qtyPart)) {
                    input.items.push({
                        rawName: namePart,
                        scope: 0,
                        totalDone: qtyPart, // Reuse this field for input quantity
                        todayDone: 0
                    });
                }
            }
        }
    }

    return input;
}

export interface ParsedPaymentInput {
    projectName: string | null;
    milestoneName: string | null;
    amount: number | null;
    date: string | null;
}

export function parsePaymentInput(text: string): ParsedPaymentInput {
    const lines = text.split('\n');
    const input: ParsedPaymentInput = {
        projectName: null,
        milestoneName: null,
        amount: null,
        date: null
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.toLowerCase().startsWith('project')) input.projectName = trimmed.split(':')[1]?.trim() || null;
        if (trimmed.toLowerCase().startsWith('milestone')) input.milestoneName = trimmed.split(':')[1]?.trim() || null;
        if (trimmed.toLowerCase().startsWith('jumlah')) {
            const rawAmount = trimmed.split(':')[1]?.trim().replace(/[^0-9]/g, '');
            input.amount = rawAmount ? parseFloat(rawAmount) : null;
        }
        if (trimmed.toLowerCase().startsWith('tanggal')) input.date = trimmed.split(':')[1]?.trim() || null;
    }

    return input;
}
