
'use client'

import { X, Printer, Download, CheckCircle2, TrendingUp, AlertCircle, Clock } from 'lucide-react'
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
                Value: data.value,
                Progress: `${data.progress || 0}%`,
                StartDate: data.start_date || '-',
                EndDate: data.end_date || '-',
                Description: (data.description || '').replace(/\n/g, ' ')
            }]

            // Add material details if available
            if (data.materialSummary?.length > 0) {
                data.materialSummary.forEach((m: any) => {
                    exportData.push({
                        Type: 'MATERIAL_USAGE',
                        Name: m.name,
                        Status: `Unit: ${m.unit}`,
                        Value: `Requirement: ${m.quantity_needed || 0}`,
                        Progress: `Used: ${m.total_out || 0}`,
                        StartDate: `Sisa: ${Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}`,
                        EndDate: '',
                        Description: ''
                    } as any)
                })
            }

            // Add POW tasks if available
            if (data.powTasks && data.powTasks.length > 0) {
                data.powTasks.forEach((t: any) => {
                    exportData.push({
                        Type: 'POW_TASK',
                        Name: t.task_name,
                        Status: t.status,
                        Value: `${t.progress}%`,
                        Progress: '',
                        StartDate: t.start_date || '',
                        EndDate: t.end_date || '',
                        Description: (t.description || '').replace(/\n/g, ' ')
                    } as any)
                })
            }

            downloadCSV(exportData, `Report_${data.name.replace(/\s+/g, '_')}.csv`)
        } else {
            const exportData = (data as any[]).map(p => ({
                Name: p.name,
                Status: p.status,
                Value: p.value,
                Progress: `${p.progress || 0}%`,
                Created: p.created_at
            }))
            downloadCSV(exportData, `Global_Project_Report_${new Date().toISOString().split('T')[0]}.csv`)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-start overflow-y-auto p-4 sm:p-6 print:p-0 print:bg-white print:block">
            <div className="bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-5xl my-4 sm:my-10 overflow-hidden print:my-0 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none">

                {/* Header - Hidden on Print */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#0F172A]/50 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-white">Project Report View</h2>
                        <p className="text-sm text-gray-400">Preview and export project data</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            onClick={triggerPrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm shadow-lg shadow-blue-900/20"
                        >
                            <Printer size={16} />
                            Save Capture / Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white transition ml-2"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-5 md:p-12 bg-white text-gray-900 print:p-0 min-h-[600px]">
                    {/* Report Letterhead */}
                    <div className="border-b-2 border-gray-900 pb-4 mb-6 sm:pb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-blue-900">Project Progress Report</h1>
                            <p className="text-sm sm:text-base text-gray-500 font-medium">Internal Project Documentation</p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Generated On</p>
                            <p className="font-bold text-sm sm:text-base">{reportDate}</p>
                        </div>
                    </div>

                    {mode === 'single' ? (
                        <div className="space-y-8">
                            {/* Single Project Detail */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Project Name</label>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{data.name}</h2>
                                </div>
                                <div className="text-left sm:text-right">
                                    <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Overall Progress</label>
                                    <div className="flex items-center justify-start sm:justify-end gap-3">
                                        <span className="text-2xl sm:text-3xl font-black text-blue-600">{data.progress || 0}%</span>
                                        <div className="flex-1 sm:flex-none sm:w-32 bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full"
                                                style={{ width: `${data.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Status</label>
                                    <p className="font-bold capitalize text-blue-700">{data.status || 'Planning'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Start Date</label>
                                    <p className="font-bold">{data.start_date ? new Date(data.start_date).toLocaleDateString() : '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">End Date</label>
                                    <p className="font-bold">{data.end_date ? new Date(data.end_date).toLocaleDateString() : '-'}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">Project Description</h3>
                                <p className="text-gray-700 leading-relaxed italic">
                                    {data.description || "No description provided for this project."}
                                </p>
                            </div>

                            {/* POW (Plan of Work) Breakdown Section */}
                            {data.powTasks && data.powTasks.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">Plan of Work (POW) Progress</h3>
                                    <div className="space-y-4">
                                        {data.powTasks.map((task: any) => (
                                            <div key={task.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{task.task_name}</h4>
                                                        <p className="text-xs text-gray-500 capitalize">{task.status.replace(/-/g, ' ')}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-blue-600">{task.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                                {(task.start_date || task.end_date) && (
                                                    <div className="mt-2 flex gap-4 text-[10px] text-gray-400 font-bold uppercase">
                                                        <span>Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}</span>
                                                        <span>End: {task.end_date ? new Date(task.end_date).toLocaleDateString() : '-'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Material Usage Section */}
                            {data.materialSummary?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">Material Detail</h3>
                                    <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                                        <table className="w-full text-left border-collapse min-w-[500px]">
                                            <thead>
                                                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                                    <th className="px-4 py-2 border border-gray-200">Material Name</th>
                                                    <th className="px-4 py-2 border border-gray-200 text-center">Unit</th>
                                                    <th className="px-4 py-2 border border-gray-200 text-right">Requirement</th>
                                                    <th className="px-4 py-2 border border-gray-200 text-right">Used (Out)</th>
                                                    <th className="px-4 py-2 border border-gray-200 text-right">Remaining</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.materialSummary.map((m: any) => (
                                                    <tr key={m.id} className="text-sm">
                                                        <td className="px-4 py-2 border border-gray-200 font-medium">{m.name}</td>
                                                        <td className="px-4 py-2 border border-gray-200 text-center text-gray-500 font-mono text-xs">{m.unit}</td>
                                                        <td className="px-4 py-2 border border-gray-200 text-right font-bold text-purple-600">{m.quantity_needed || 0}</td>
                                                        <td className="px-4 py-2 border border-gray-200 text-right font-bold text-blue-600">{m.total_out || 0}</td>
                                                        <td className="px-4 py-2 border border-gray-200 text-right font-bold text-gray-400">
                                                            {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 italic">* Showing all materials associated with this project (requirements and usage).</p>
                                </div>
                            )}

                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border border-gray-200 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Total Project Value</p>
                                    <p className="text-xl font-bold">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.value || 0)}
                                    </p>
                                </div>
                                <div className="border border-gray-200 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Route Distance</p>
                                    <p className="text-xl font-bold">{(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)} KM</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Global Summary Table */}
                            <h3 className="text-xl font-bold text-gray-800">Portfolio Summary</h3>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 uppercase text-[10px] font-bold">
                                        <th className="px-4 py-3 border border-gray-200">No</th>
                                        <th className="px-4 py-3 border border-gray-200">Project Name</th>
                                        <th className="px-4 py-3 border border-gray-200">Status</th>
                                        <th className="px-4 py-3 border border-gray-200 text-center">Progress</th>
                                        <th className="px-4 py-3 border border-gray-200 text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data as any[]).map((p, i) => (
                                        <tr key={p.id} className="text-sm">
                                            <td className="px-4 py-2 border border-gray-200 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-2 border border-gray-200 font-bold">{p.name}</td>
                                            <td className="px-4 py-2 border border-gray-200 capitalize">{p.status}</td>
                                            <td className="px-4 py-2 border border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
                                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                                                    </div>
                                                    <span className="font-bold text-blue-600 w-10 text-right">{p.progress || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 border border-gray-200 text-right font-mono">
                                                {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(p.value || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 border border-gray-200 text-right uppercase text-xs">Total Portfolio Value</td>
                                        <td colSpan={2} className="px-4 py-3 border border-gray-200 text-right text-blue-800 text-lg">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format((data as any[]).reduce((acc, p) => acc + (p.value || 0), 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Footer for Report */}
                    <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                        <div>Gravity Management System &bull; Confidential</div>
                        <div>Page 1 of 1</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
