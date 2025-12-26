'use client'

import { useState, useEffect } from 'react'
import { getDailyReports } from '@/app/actions/report-actions'
import { Calendar, Users, Briefcase, ChevronDown, ChevronUp, HardDrive } from 'lucide-react'

interface DailyReportProps {
    projectId: string
}

export default function DailyReportHistory({ projectId }: DailyReportProps) {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const data = await getDailyReports(projectId)
            setReports(data)
            setLoading(false)
        }
        load()
    }, [projectId])

    if (loading) return <div className="p-4 text-center text-gray-500 text-sm">Loading reports...</div>
    if (reports.length === 0) return (
        <div className="bg-[#1E293B] p-8 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-500 text-sm italic">No daily reports received from Telegram yet.</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-blue-500" />
                Daily Reports History
            </h2>

            <div className="space-y-3">
                {reports.map((report) => (
                    <div
                        key={report.id}
                        className={`bg-[#1E293B] rounded-xl border transition-all ${expandedReportId === report.id ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        {/* Summary Header */}
                        <div
                            className="p-4 cursor-pointer flex items-center justify-between"
                            onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-sm">
                                        {new Date(report.report_date).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} /> {report.manpower_count} Person
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Briefcase size={12} /> {report.executor_name || 'Anonymous'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {report.items?.length > 0 && (
                                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
                                        {report.items.length} Materials
                                    </span>
                                )}
                                {expandedReportId === report.id ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {expandedReportId === report.id && (
                            <div className="p-4 pt-0 border-t border-gray-700/50 space-y-4 bg-[#0F172A]/30 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Today Activity</label>
                                        <div className="text-sm text-gray-300 bg-[#0F172A] p-3 rounded-lg border border-gray-700 whitespace-pre-wrap">
                                            {report.today_activity || "No activity reported."}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Tomorrow Plan</label>
                                        <div className="text-sm text-gray-300 bg-[#0F172A] p-3 rounded-lg border border-gray-700 whitespace-pre-wrap">
                                            {report.tomorrow_plan || "No plan reported."}
                                        </div>
                                    </div>
                                </div>

                                {report.items?.length > 0 && (
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-2 px-1">Material Updates (Today Progress)</label>
                                        <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-800 text-gray-400 font-medium">
                                                    <tr>
                                                        <th className="px-3 py-2">Material</th>
                                                        <th className="px-3 py-2 text-center">Scope</th>
                                                        <th className="px-3 py-2 text-center">Done</th>
                                                        <th className="px-3 py-2 text-center text-blue-400">Today</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800">
                                                    {report.items.map((item: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-800/30">
                                                            <td className="px-3 py-2 text-gray-300 font-medium">{item.material_name_snapshot}</td>
                                                            <td className="px-3 py-2 text-center text-gray-500">{item.quantity_scope}</td>
                                                            <td className="px-3 py-2 text-center text-gray-500">{item.quantity_total}</td>
                                                            <td className="px-3 py-2 text-center font-bold text-blue-400">+{item.quantity_today}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-700/50">
                                    <div className="flex justify-between items-center text-[10px] text-gray-600">
                                        <span>Waspang: {report.waspang_name || '-'}</span>
                                        <span>System ID: {report.id.substring(0, 8)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
