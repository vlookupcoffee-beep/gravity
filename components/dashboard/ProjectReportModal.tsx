
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

            // Add structures breakdown if available
            if (data.structures && Object.keys(data.structures).length > 0) {
                Object.entries(data.structures).forEach(([name, count]) => {
                    exportData.push({
                        Type: 'STRUCTURE',
                        Name: name,
                        Status: 'Count',
                        Value: count as string,
                        Progress: '',
                        StartDate: '',
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
                Value: p.value,
                Progress: `${p.progress || 0}%`,
                Created: p.created_at
            }))
            downloadCSV(exportData, `Global_Project_Report_${new Date().toISOString().split('T')[0]}.csv`)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:block">
            <div className="bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none">

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
                <div className="p-8 md:p-12 bg-white text-gray-900 print:p-0 min-h-[600px]">
                    {/* Report Letterhead */}
                    <div className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-900">Project Progress Report</h1>
                            <p className="text-gray-500 font-medium">Internal Project Documentation</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase font-bold text-gray-400">Generated On</p>
                            <p className="font-bold">{reportDate}</p>
                        </div>
                    </div>

                    {mode === 'single' ? (
                        <div className="space-y-8">
                            {/* Single Project Detail */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Project Name</label>
                                    <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
                                </div>
                                <div className="text-right">
                                    <label className="text-xs uppercase font-bold text-gray-400 block mb-1">Overall Progress</label>
                                    <div className="flex items-center justify-end gap-3">
                                        <span className="text-3xl font-black text-blue-600">{data.progress || 0}%</span>
                                        <div className="w-32 bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full"
                                                style={{ width: `${data.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
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

                            {/* Structures Breakdown Section */}
                            {data.structures && Object.keys(data.structures).length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">Structures Breakdown</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(data.structures).map(([name, count]: [string, any]) => (
                                            <div key={name} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">{name}</label>
                                                <p className="text-xl font-bold text-blue-900">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Material Usage Section */}
                            {data.materialSummary?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">Material Detail</h3>
                                    <table className="w-full text-left border-collapse">
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
                                    <p className="text-[10px] text-gray-400 mt-2 italic">* Showing all materials associated with this project (requirements and usage).</p>
                                </div>
                            )}

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4">
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
