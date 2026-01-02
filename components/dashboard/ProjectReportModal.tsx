
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
        <div className="fixed inset-0 bg-[#0F172A]/98 backdrop-blur-xl z-[100] flex justify-center items-start overflow-y-auto p-0 sm:p-4 print:p-0 print:bg-white print:block">
            <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-7xl my-0 sm:my-4 overflow-hidden print:my-0 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none">

                {/* Header - Hidden on Print */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <TrendingUp className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 tracking-tight">Project Dashboard</h2>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-black">Live Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs font-bold"
                        >
                            <Download size={14} />
                            CSV
                        </button>
                        <button
                            onClick={triggerPrint}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-black shadow-lg shadow-blue-600/20"
                        >
                            <Printer size={14} />
                            Print Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-slate-50 text-slate-900 print:bg-white">
                    {mode === 'single' ? (
                        <div className="flex flex-col">
                            {/* Hero Section */}
                            <div className="bg-[#0F172A] text-white p-8 sm:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />

                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                                    <div className="flex flex-col gap-2 text-center lg:text-left">
                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500/20 text-blue-400 border border-blue-500/30 w-fit mx-auto lg:mx-0">
                                            Project Protocol
                                        </div>
                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight uppercase max-w-3xl">
                                            {data.name}
                                        </h1>
                                        <div className="flex items-center justify-center lg:justify-start gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{data.status || 'ACTIVE'}</span>
                                            </div>
                                            <span className="text-slate-700">•</span>
                                            <span>{reportDate}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[300px]">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Coverage</p>
                                            <p className="text-2xl font-black text-white leading-none">{(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)}<span className="text-xs ml-1 text-slate-400">KM</span></p>
                                        </div>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Progress</span>
                                                <span className="text-3xl font-black text-blue-400 leading-none">{data.progress || 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                    style={{ width: `${data.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="p-6 sm:p-10 space-y-8">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

                                    {/* Column Left: Execution & Daily Report */}
                                    <div className="space-y-8">
                                        {/* Execution Timeline (POW) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Execution Timeline</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority Milestones</p>
                                                </div>
                                                <TrendingUp size={24} className="text-slate-200" />
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {filteredPowTasks?.map((task: any) => (
                                                    <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-tight truncate mr-4">
                                                                    {task.task_name}
                                                                </h4>
                                                                <span className="text-sm font-black text-blue-600">{task.progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className="bg-blue-600 h-full rounded-full transition-all duration-700"
                                                                    style={{ width: `${task.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 border-l border-slate-50 pl-6">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                                            <p className={`text-xs font-black uppercase ${task.status === 'completed' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                                {task.status.replace(/-/g, ' ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Daily Execution Report (The Red Box Request) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-4">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Daily Execution Report</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest Field Activity</p>
                                                </div>
                                                <AlertCircle size={24} className="text-slate-200" />
                                            </div>

                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                                                {data.dailyReport ? (
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                                                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Report Session</span>
                                                            </div>
                                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                                                                {new Date(data.dailyReport.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-1.5">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today Activity</p>
                                                                <p className="text-sm font-bold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500">
                                                                    {data.dailyReport.today_activity}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Plan</p>
                                                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic bg-slate-50/50 p-4 rounded-2xl border-l-4 border-slate-300">
                                                                    {data.dailyReport.tomorrow_plan}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                                                            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">Executor:</p>
                                                                <p className="text-xs font-black text-slate-700 uppercase">{data.dailyReport.executor_name || 'System'}</p>
                                                            </div>
                                                            <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase">Manpower:</p>
                                                                <p className="text-xs font-black text-slate-700">{data.dailyReport.manpower_count || 0} People</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10">
                                                        <AlertCircle className="mx-auto text-slate-200 mb-3" size={40} />
                                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">No Active Daily Report</p>
                                                        <p className="text-xs text-slate-300 italic max-w-xs mx-auto">
                                                            {data.description || "Project overview data is available in the operational context description."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column Right: Material Inventory */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-l-4 border-slate-900 pl-4">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Material Inventory</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Stock Analysis</p>
                                            </div>
                                            <Package size={24} className="text-slate-200" />
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-900 text-white">
                                                        <th className="pl-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Inventory Item</th>
                                                        <th className="pr-6 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Req / Used / Sisa</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.materialSummary.map((m: any) => (
                                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="pl-6 py-4">
                                                                <div className="font-black text-slate-900 text-sm truncate max-w-[200px]">{m.name}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.unit}</div>
                                                            </td>
                                                            <td className="pr-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-3">
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-bold text-slate-300 uppercase leading-none mb-1">Status</p>
                                                                        <div className="flex items-center justify-end gap-2 text-xs font-black">
                                                                            <span className="text-slate-400">{m.quantity_needed || 0}</span>
                                                                            <span className="text-slate-200">/</span>
                                                                            <span className="text-blue-600">{m.total_out || 0}</span>
                                                                            <span className="text-slate-200">/</span>
                                                                            <span className={`${((m.quantity_needed || 0) - (m.total_out || 0)) <= 0 ? 'text-red-500 bg-red-50' : 'text-slate-900 bg-slate-100'} px-2 py-0.5 rounded-lg`}>
                                                                                {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}
                                                                            </span>
                                                                        </div>
                                                                    </div>
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
                        /* Global Report View - Keep simple but clean */
                        <div className="p-8 sm:p-12 space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-slate-900 pb-10">
                                <div>
                                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-3">Portfolio Analysis</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Global Project Status Overview</p>
                                    </div>
                                </div>
                                <div className="text-right w-full md:w-auto p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
                                    <p className="text-xs uppercase font-black text-slate-400 mb-2 tracking-widest">Active Projects</p>
                                    <p className="text-4xl font-black">{(data as any[]).length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-60">#</th>
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Designation</th>
                                            <th className="px-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] opacity-60 text-center">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(data as any[]).map((p, i) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-6 text-xs font-black text-slate-300">{String(i + 1).padStart(2, '0')}</td>
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors text-lg tracking-tight uppercase">{p.name}</div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="p-1 px-3 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                            {p.status || 'ACTIVE'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">REF: {p.id.slice(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 min-w-[300px]">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${p.progress || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-blue-600 text-xl w-14 text-right">{p.progress || 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-10 bg-[#0F172A] text-white border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] tracking-[0.3em] uppercase font-black">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-blue-400" />
                            <span>System Generated Project Protocol</span>
                        </div>
                        <div className="text-slate-500">
                            Gravity &bull; {new Date().getFullYear()} &bull; Operational Data Record
                        </div>
                        <div className="p-2 px-5 bg-white/5 rounded-full border border-white/10">Page 01 // 01</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
