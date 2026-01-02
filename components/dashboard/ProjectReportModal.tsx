
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
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex justify-center items-center overflow-hidden p-0 sm:p-4 print:p-0 print:bg-white print:block">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-[1440px] h-full sm:h-auto max-h-[98vh] flex flex-col overflow-hidden print:max-h-none print:h-auto print:shadow-none print:rounded-none">

                {/* Top Action Bar - Hidden on Print */}
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-white print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <TrendingUp className="text-white" size={14} />
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Protocol Engine v2.1</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownloadCSV} className="p-1.5 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors">
                            <Download size={16} />
                        </button>
                        <button onClick={triggerPrint} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-[10px] font-black uppercase">
                            <Printer size={12} />
                            Print
                        </button>
                        <div className="w-px h-6 bg-slate-100 mx-1" />
                        <button onClick={onClose} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Main Container */}
                <div className="flex-1 overflow-y-auto print:overflow-visible bg-slate-50 p-4 sm:p-5 space-y-4">
                    {mode === 'single' ? (
                        <div className="space-y-4">
                            {/* Slim Header Section */}
                            <div className="bg-[#0F172A] text-white p-4 rounded-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-10 -mt-10" />

                                <div className="relative z-10 flex flex-col gap-0.5">
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-400 border border-blue-500/30 w-fit">
                                        Project System Overdrive
                                    </div>
                                    <h1 className="text-xl font-black tracking-tighter leading-tight uppercase text-white truncate max-w-[600px]">
                                        {data.name}
                                    </h1>
                                    <div className="flex items-center gap-3 text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            <span>{data.status || 'ACTIVE'}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{reportDate}</span>
                                    </div>
                                </div>

                                <div className="relative z-10 flex items-center gap-5 bg-white/5 backdrop-blur-sm p-3 px-4 rounded-xl border border-white/10 shrink-0">
                                    <div className="text-center">
                                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Coverage</p>
                                        <p className="text-base font-black text-white leading-none">
                                            {(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)}
                                            <span className="text-[9px] ml-0.5 opacity-50 font-bold">KM</span>
                                        </p>
                                    </div>
                                    <div className="h-6 w-px bg-white/10" />
                                    <div className="w-28">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Progress</span>
                                            <span className="text-base font-black text-blue-400 leading-none">{data.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden border border-white/5">
                                            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${data.progress || 0}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* REORGANIZED CONTENT GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                {/* COLUMN 1 (LEFT, 1 SPAN): POW + DAILY REPORT STACKED */}
                                <div className="lg:col-span-1 space-y-4">
                                    {/* Execution Timeline */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 px-1">
                                            <TrendingUp size={12} className="text-blue-600" />
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Execution Timeline</h3>
                                        </div>
                                        <div className="space-y-1.5">
                                            {filteredPowTasks?.map((task: any) => (
                                                <div key={task.id} className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <h4 className="font-bold text-slate-800 text-[10px] leading-tight flex-1 pr-2 uppercase truncate">
                                                            {task.task_name}
                                                        </h4>
                                                        <span className="text-[9px] font-black text-blue-600">{task.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-50 rounded-full h-1 overflow-hidden">
                                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Daily Execution Report (Stacked Below POW) */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2 px-1">
                                            <AlertCircle size={12} className="text-indigo-600" />
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Daily Feedback</h3>
                                        </div>
                                        <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                                            {data.dailyReport ? (
                                                <div className="flex flex-col">
                                                    <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Live Feed</span>
                                                        <span className="text-[8px] font-black text-indigo-600 opacity-70">
                                                            {new Date(data.dailyReport.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="p-3 space-y-3">
                                                        <div className="space-y-0.5">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                                                            <p className="text-[10px] font-bold text-slate-700 leading-tight border-l-2 border-indigo-400 pl-2">
                                                                {data.dailyReport.today_activity}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Next</p>
                                                            <p className="text-[10px] font-medium text-slate-500 italic leading-tight border-l-2 border-slate-200 pl-2 line-clamp-2">
                                                                {data.dailyReport.tomorrow_plan}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                                                            <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                                                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5 leading-none">Executor</p>
                                                                <p className="text-[8px] font-black text-slate-700 uppercase truncate">{data.dailyReport.executor_name || 'System'}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-1.5 rounded-lg text-center">
                                                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5 leading-none">Team</p>
                                                                <p className="text-[8px] font-black text-slate-700">{data.dailyReport.manpower_count || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-6 text-center bg-slate-50/50">
                                                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">No Active Feedback</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 2 (RIGHT, 2 SPANS): MATERIAL INVENTORY (GRID) */}
                                <div className="lg:col-span-2 space-y-2.5">
                                    <div className="flex items-center gap-2 px-1">
                                        <Package size={12} className="text-slate-700" />
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Material Inventory - Strategic Analysis</h3>
                                    </div>
                                    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
                                        {/* Material Items Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 divide-x divide-y divide-slate-50">
                                            {data.materialSummary.map((m: any) => (
                                                <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex-1 min-w-0 pr-3">
                                                        <div className="font-bold text-slate-800 text-[10px] uppercase truncate group-hover:text-blue-600 transition-colors">{m.name}</div>
                                                        <div className="text-[8px] font-medium text-slate-400 uppercase tracking-tight">{m.unit}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold">
                                                            <span className="text-slate-300">{m.quantity_needed || 0}</span>
                                                            <span className="text-slate-200">/</span>
                                                            <span className="text-blue-500">{m.total_out || 0}</span>
                                                        </div>
                                                        <div className={`text-[10px] font-black px-2 py-0.5 mt-1 rounded-lg ${((m.quantity_needed || 0) - (m.total_out || 0)) <= 0 ? 'text-red-600 bg-red-50' : 'text-slate-900 bg-slate-100 font-black'}`}>
                                                            {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))} SISA
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {data.materialSummary.length === 0 && (
                                            <div className="p-10 text-center">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase">Inventory records cleared</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        /* Global Report View - Fixed for vertical space */
                        <div className="p-2 space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-1">Portfolio Matrix</h1>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px]">Global Deployment Status</p>
                                </div>
                                <div className="text-right p-3 bg-slate-900 text-white rounded-lg">
                                    <p className="text-[8px] uppercase font-black text-slate-500 mb-0.5">Active</p>
                                    <p className="text-lg font-black leading-none">{(data as any[]).length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest opacity-60">
                                            <th className="px-5 py-2.5">№</th>
                                            <th className="px-5 py-2.5">Project Designation</th>
                                            <th className="px-5 py-2.5 text-right">Execution Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(data as any[]).map((p, i) => (
                                            <tr key={p.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-3 text-[10px] font-black text-slate-300">{i + 1}</td>
                                                <td className="px-5 py-3">
                                                    <div className="font-black text-slate-900 text-xs uppercase tracking-tight truncate max-w-[400px]">{p.name}</div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="w-20 bg-slate-100 rounded-full h-1 overflow-hidden">
                                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-blue-600 text-[10px] w-8">{p.progress || 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Horizontal Action Bar / Footer */}
                <div className="px-5 py-2 bg-[#0F172A] text-white flex justify-between items-center text-[7px] tracking-[0.2em] uppercase font-black shrink-0">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={10} className="text-blue-400" />
                        <span>Analytical Snapshot // Gravity Network Protocol</span>
                    </div>
                    <div className="opacity-40">
                        &copy; {new Date().getFullYear()} &bull; Operational Data Sync
                    </div>
                </div>
            </div>
        </div>
    )
}
