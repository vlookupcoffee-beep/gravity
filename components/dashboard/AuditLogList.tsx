
'use client'

import React, { useEffect, useState } from 'react'
import { getAuditLogs } from '@/app/actions/audit-actions'
import { History, User, Clock, Tag } from 'lucide-react'

interface AuditLogListProps {
    projectId: string
}

export default function AuditLogList({ projectId }: AuditLogListProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getAuditLogs(projectId)
                setLogs(res)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [projectId])

    if (loading) return <div className="h-48 bg-gray-800/20 animate-pulse rounded-xl" />

    return (
        <div className="bg-[#1E293B] p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
                <History className="text-gray-400" size={18} />
                <h2 className="font-bold text-white">Activity Log</h2>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No recent activity.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-3 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                            <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.action === 'INSERT' ? 'bg-emerald-500/10 text-emerald-400' :
                                    log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                                        log.action === 'SYNC' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-purple-500/10 text-purple-400'
                                }`}>
                                <Tag size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        {log.action} • {log.table_name.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 font-medium truncate">
                                    {log.action === 'SYNC' ? `Progress updated to ${log.new_data?.progress}%` :
                                        log.action === 'DELETE' ? `Deleted item ${log.old_data?.item_code || 'BOQ'}` :
                                            log.action === 'UPDATE' ? `Uploaded ${log.new_data?.addedCount || 'new'} items` :
                                                `Action on ${log.table_name}`}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <User size={10} className="text-gray-600" />
                                    <span className="text-[10px] text-gray-500 font-bold">{log.changed_by}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
