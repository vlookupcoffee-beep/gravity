
'use client'

import { X, Printer, Download, CheckCircle2, TrendingUp, AlertCircle, Clock, Package } from 'lucide-react'
import { downloadCSV, triggerPrint } from '@/utils/export-utils'

interface ProjectReportModalProps {
    mode: 'single' | 'global'
    data: any | any[]
    onClose: () => void
}

export default function ProjectReportModal({ mode, data, onClose }: ProjectReportModalProps) {
    const reportDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    const allowedPowCategories = [
        "3.3 Penanaman Tiang dan Pembuatan HH",
        "3.4 Penarikan Kabel Duct",
        "3.5 Joint dan Terminasi"
    ]

    const filteredPowTasks = mode === 'single' && data.powTasks
        ? data.powTasks.filter((t: any) => allowedPowCategories.includes(t.task_name))
        : []

    const handleDownloadCSV = () => {
        if (mode === 'single') {
            const exportData = [{
                Type: 'PROJECT_INFO',
                Name: data.name,
                Status: data.status,
                Progress: `${data.progress || 0}%`,
                StartDate: data.start_date || '-',
                EndDate: data.end_date || '-',
                Description: (data.description || '').replace(/\n/g, ' ')
            }]

            if (filteredPowTasks && filteredPowTasks.length > 0) {
                filteredPowTasks.forEach((t: any) => {
                    exportData.push({
                        Type: 'POW_TASK',
                        Name: t.task_name,
                        Status: t.status,
                        Progress: `${t.progress}%`,
                        StartDate: t.start_date || '',
                        EndDate: t.end_date || '',
                        Description: (t.description || '').replace(/\n/g, ' ')
                    } as any)
                })
            }

            if (data.materialSummary?.length > 0) {
                data.materialSummary.forEach((m: any) => {
                    exportData.push({
                        Type: 'MATERIAL_STOCK',
                        Name: m.name,
                        Status: `Unit: ${m.unit}`,
                        Progress: `Used: ${m.total_out || 0} / ${m.quantity_needed || 0}`,
                        StartDate: `Remaining: ${Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}`,
                        EndDate: '',
                        Description: ''
                    } as any)
                })
            }

            downloadCSV(exportData, `Report_${data.name.replace(/\s+/g, '_')}.csv`)
        } else {
            const exportData = (data as any[]).map(p => ({
                Name: p.name,
                Status: p.status,
                Progress: `${p.progress || 0}%`,
                Created: p.created_at
            }))
            downloadCSV(exportData, `Global_Project_Report_${new Date().toISOString().split('T')[0]}.csv`)
        }
    }

    return (
        <div className="fixed inset-0 bg-[#0F172A]/95 backdrop-blur-md z-[100] flex justify-center items-start overflow-y-auto p-0 sm:p-6 print:p-0 print:bg-white print:block">
            <div className="bg-[#1E293B] border border-slate-700/50 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-6xl my-0 sm:my-8 overflow-hidden print:my-0 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none">

                {/* Header - Hidden on Print */}
                <div className="px-5 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <TrendingUp className="text-blue-400" size={16} />
                            <h2 className="text-sm font-bold text-white tracking-tight">Project Dashboard</h2>
                        </div>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Live Analytics</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all border border-slate-700/50 text-[10px] font-semibold"
                        >
                            <Download size={12} />
                            CSV
                        </button>
                        <button
                            onClick={triggerPrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-[10px] font-bold shadow-lg shadow-blue-600/20"
                        >
                            <Printer size={12} />
                            Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg border border-slate-700/50"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-slate-50 text-slate-900 print:bg-white text-[10px]">
                    {mode === 'single' ? (
                        <div className="flex flex-col">
                            {/* Compact Hero Section */}
                            <div className="bg-slate-900 text-white p-4 sm:p-5 relative overflow-hidden border-b border-slate-800">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-10 -mt-10" />

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-400 border border-blue-500/30 w-fit">
                                            Project Protocol
                                        </div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tighter leading-none uppercase">
                                            {data.name}
                                        </h1>
                                        <div className="flex items-center gap-3 text-slate-500 text-[8px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1">
                                                <Clock size={8} />
                                                <span>{data.status || 'PLANNING'}</span>
                                            </div>
                                            <span>•</span>
                                            <span>{reportDate}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                                        <div className="text-center">
                                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Coverage</p>
                                            <p className="text-xs font-black text-white">{(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)} KM</p>
                                        </div>
                                        <div className="h-6 w-px bg-slate-700" />
                                        <div className="flex flex-col items-center">
                                            <div className="flex justify-between w-24 mb-1">
                                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                                                <span className="text-xs font-black text-blue-400 leading-none">{data.progress || 0}%</span>
                                            </div>
                                            <div className="w-24 bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-700">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${data.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Body - Side-by-Side Grid */}
                            <div className="p-4 sm:p-5 space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

                                    {/* Column Left: Plan of Work */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-l-[3px] border-blue-600 pl-2.5">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Execution Timeline</h3>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Priority Milestones</p>
                                            </div>
                                            <TrendingUp size={12} className="text-slate-300" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-1.5">
                                            {filteredPowTasks?.map((task: any) => (
                                                <div key={task.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3 group">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-slate-900 text-[10px] group-hover:text-blue-600 transition-colors leading-tight truncate">
                                                            {task.task_name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex-1 bg-slate-50 rounded-full h-0.5 overflow-hidden">
                                                                <div
                                                                    className="bg-blue-600 h-full rounded-full transition-all duration-700"
                                                                    style={{ width: `${task.progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-black text-blue-600 w-10 text-right">{task.progress}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                                        <p className={`text-[8px] font-black uppercase ${task.status === 'completed' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {task.status.split('-')[0]}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredPowTasks.length === 0 && (
                                                <div className="text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-[10px] font-bold uppercase">
                                                    No prioritized tasks found
                                                </div>
                                            )}
                                        </div>

                                        {/* Daily Execution Report / Slim Description Area */}
                                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 border-dashed">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <AlertCircle size={8} />
                                                    {data.dailyReport ? 'Daily Execution Report' : 'Operational Context'}
                                                </h4>
                                                {data.dailyReport && (
                                                    <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">
                                                        {new Date(data.dailyReport.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>

                                            {data.dailyReport ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className="shrink-0">
                                                            <p className="text-[6px] font-black text-slate-400 uppercase tracking-tight">Activity</p>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                                                        </div>
                                                        <p className="text-[9px] text-slate-600 leading-tight font-medium">
                                                            {data.dailyReport.today_activity}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="shrink-0">
                                                            <p className="text-[6px] font-black text-slate-400 uppercase tracking-tight">Next Plan</p>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1" />
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 leading-tight italic">
                                                            {data.dailyReport.tomorrow_plan}
                                                        </p>
                                                    </div>
                                                    <div className="pt-1 mt-1 border-t border-slate-100 flex justify-between items-center">
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase">Executor:</p>
                                                            <p className="text-[7px] font-black text-slate-600 uppercase">{data.dailyReport.executor_name || 'System'}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase">Manpower:</p>
                                                            <p className="text-[7px] font-black text-slate-600">{data.dailyReport.manpower_count || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">
                                                    {data.description || "No specific project description or daily reports available for this session."}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column Right: Material Inventory */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-l-[3px] border-slate-900 pl-2.5">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Material Inventory</h3>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Live Stock Analysis</p>
                                            </div>
                                            <Package size={12} className="text-slate-300" />
                                        </div>

                                        <div className="overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100">
                                                        <th className="pl-3 py-1.5 text-[7px] font-black uppercase tracking-widest text-slate-400">Item Name</th>
                                                        <th className="pr-3 py-1.5 text-[7px] font-black uppercase tracking-widest text-slate-400 text-right">Req / Used / Sisa</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.materialSummary.map((m: any) => (
                                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="pl-3 py-1.5">
                                                                <div className="font-bold text-slate-900 text-[9px] truncate max-w-[120px]">{m.name}</div>
                                                                <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{m.unit}</div>
                                                            </td>
                                                            <td className="pr-3 py-1.5 text-right font-black">
                                                                <div className="flex items-center justify-end gap-1.5 text-[9px]">
                                                                    <span className="text-slate-400">{m.quantity_needed || 0}</span>
                                                                    <span className="text-slate-300">/</span>
                                                                    <span className="text-blue-600">{m.total_out || 0}</span>
                                                                    <span className="text-slate-300">/</span>
                                                                    <span className={`${((m.quantity_needed || 0) - (m.total_out || 0)) <= 0 ? 'text-red-500' : 'text-slate-900'} bg-slate-50 px-1 rounded`}>
                                                                        {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 sm:p-10 space-y-8">
                            {/* Global Summary Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b-2 border-slate-900 pb-6 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">Portfolio Analysis</h1>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Global Project Status Overview</p>
                                </div>
                                <div className="text-right w-full sm:w-auto p-4 bg-slate-900 text-white rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Active Projects</p>
                                    <p className="text-2xl font-black">{(data as any[]).length}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">No</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Project Designation</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60">Current Status</th>
                                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest opacity-60 text-center">Execution Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(data as any[]).map((p, i) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 text-[10px] font-black text-slate-300">{i + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">ID: {p.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="p-1 px-3 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                        {p.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 min-w-[200px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-blue-600 text-xs w-10 text-right">{p.progress || 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer for Report */}
                    <div className="p-10 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] tracking-[0.2em] uppercase font-black">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={12} className="text-blue-400" />
                            <span>System Generated Project Protocol</span>
                        </div>
                        <div className="text-slate-500">
                            Gravity Network &bull; {new Date().getFullYear()} &bull; Internal Record
                        </div>
                        <div className="p-1 px-3 bg-slate-800 rounded-full">Page 01 // 01</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
