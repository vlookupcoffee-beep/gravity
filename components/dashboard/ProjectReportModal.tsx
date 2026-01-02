
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

            // Add POW tasks if available
            if (data.powTasks && data.powTasks.length > 0) {
                data.powTasks.forEach((t: any) => {
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

            // Add material details if available
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
                <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <TrendingUp className="text-blue-400" size={18} />
                            <h2 className="text-lg font-bold text-white tracking-tight">Project Dashboard</h2>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Live Analytics & Reporting</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700/50 text-xs font-semibold"
                        >
                            <Download size={14} />
                            CSV
                        </button>
                        <button
                            onClick={triggerPrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-blue-600/20"
                        >
                            <Printer size={14} />
                            Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-xl border border-slate-700/50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-slate-50 text-slate-900 print:bg-white">
                    {mode === 'single' ? (
                        <div className="flex flex-col">
                            {/* Hero Banner Section */}
                            <div className="bg-slate-900 text-white p-6 sm:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-10 -mb-10" />

                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white mb-2">
                                            Project Overview
                                        </div>
                                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
                                            {data.name}
                                        </h1>
                                        <div className="flex items-center gap-4 text-slate-400 text-sm font-medium pt-2">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{data.status || 'PLANNING'}</span>
                                            </div>
                                            <span className="text-slate-700">•</span>
                                            <div className="flex items-center gap-1.5">
                                                <Printer size={14} />
                                                <span>{reportDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px]">
                                        <div className="flex justify-between w-full mb-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                                            <span className="text-3xl font-black text-blue-400 leading-none">{data.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-4 relative overflow-hidden p-1 border border-slate-700">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 shadow-lg shadow-blue-500/20"
                                                style={{ width: `${data.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard Body */}
                            <div className="p-5 sm:p-10 space-y-10">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                                    {[
                                        { label: 'Start Date', value: data.start_date ? new Date(data.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-', icon: <Clock size={16} className="text-blue-500" /> },
                                        { label: 'End Date', value: data.end_date ? new Date(data.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-', icon: <Clock size={16} className="text-indigo-500" /> },
                                        { label: 'Coverage', value: `${(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)} KM`, icon: <TrendingUp size={16} className="text-emerald-500" /> }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                                                <p className="text-sm sm:text-base font-black text-slate-900">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle className="text-slate-400" size={18} />
                                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Description</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-sm italic border-l-4 border-slate-100 pl-4 py-1">
                                        {data.description || "Project documentation overview without specific description provided."}
                                    </p>
                                </div>

                                {/* Main Sections: POW & Materials */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    {/* Left Side: Plan of Work */}
                                    <div className="lg:col-span-12">
                                        <div className="flex items-center justify-between border-b-2 border-slate-900/5 pb-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white">
                                                    <TrendingUp size={18} />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Execution Timeline</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan of Work Breakdown</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {data.powTasks?.map((task: any) => (
                                                <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-tight">{task.task_name}</h4>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-block w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.status.replace(/-/g, ' ')}</span>
                                                            </div>
                                                        </div>
                                                        <span className="p-1 px-2.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{task.progress}%</span>
                                                    </div>

                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                                                        <div
                                                            className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>

                                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <span>{task.start_date ? new Date(task.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'Start TBD'}</span>
                                                        <span>{task.end_date ? new Date(task.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : 'End TBD'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Material Analytics */}
                                    <div className="lg:col-span-12">
                                        <div className="flex items-center justify-between border-b-2 border-slate-900/5 pb-4 mb-6 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                                    <Package size={18} />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Material Inventory</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stock Analysis</span>
                                        </div>

                                        <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                            <table className="w-full text-left border-collapse min-w-[600px]">
                                                <thead>
                                                    <tr className="bg-slate-900/[0.02] border-b border-slate-100">
                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Name</th>
                                                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Unit</th>
                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Requirement</th>
                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Consumed</th>
                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right bg-slate-900/5">Stock Sisa</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.materialSummary.map((m: any) => (
                                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-black text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">{m.name}</div>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category: Primary</div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold text-[10px] uppercase">{m.unit}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-black text-slate-400 text-xs">{m.quantity_needed || 0}</td>
                                                            <td className="px-6 py-4 text-right font-black text-blue-600 text-xs">{m.total_out || 0}</td>
                                                            <td className={`px-6 py-4 text-right font-black text-sm bg-slate-900/5 ${((m.quantity_needed || 0) - (m.total_out || 0)) <= 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                                                {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}
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
