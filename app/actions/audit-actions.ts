
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from './auth-actions'

/**
 * Log an action to the audit_logs table
 */
export async function logAuditAction(params: {
    tableName: string;
    recordId?: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC';
    oldData?: any;
    newData?: any;
}) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    try {
        const { error } = await supabase.from('audit_logs').insert({
            table_name: params.tableName,
            record_id: params.recordId,
            action: params.action,
            old_data: params.oldData,
            new_data: params.newData,
            changed_by: user ? `${user.username} (${user.role})` : 'System'
        })

        if (error) {
            console.error('Audit Log Error:', error)
        }
    } catch (e) {
        console.error('Audit Logging failed:', e)
    }
}

export async function getAuditLogs(recordId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Fetch Audit Logs Error:', error)
        return []
    }

    return data
}
