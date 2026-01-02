
'use client'

import { useState } from 'react'
import { X, Printer, Download, CheckCircle2, TrendingUp, AlertCircle, Clock, Package, Loader2 } from 'lucide-react'
import { downloadCSV, triggerPrint } from '@/utils/export-utils'
import { sendTelegramReport } from '@/app/actions/telegram-actions'
import { Send, Users, User as UserIcon } from 'lucide-react'

// Add global styles for PDF export to disable problematic CSS
const pdfStyles = `
  .pdf-export-active * {
    transition: none !important;
    animation: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .pdf-export-active .no-pdf,
  .print-mode .no-pdf {
    display: none !important;
  }
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    aside, .print-hidden {
      display: none !important;
    }
  }
`;

interface ProjectReportModalProps {
    mode: 'single' | 'global'
    data: any | any[]
    onClose: () => void
}

export default function ProjectReportModal({ mode, data, onClose }: ProjectReportModalProps) {
    const [isDownloading, setIsDownloading] = useState(false)
    const [telegramTarget, setTelegramTarget] = useState<'private' | 'group'>('group')
    const [sendSuccess, setSendSuccess] = useState(false)

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

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content')
        if (!element) {
            console.error("Report content element not found")
            return
        }

        try {
            setIsDownloading(true)

            // 1. Add PDF-specific styles to document
            const styleTag = document.createElement('style')
            styleTag.innerHTML = pdfStyles
            document.head.appendChild(styleTag)
            document.body.classList.add('pdf-export-active')

            // 2. Short delay to let styles apply and UI thread breathe
            await new Promise(r => setTimeout(r, 500))

            // 3. Import html2pdf
            // @ts-ignore
            const html2pdfModule = await import('html2pdf.js')
            const html2pdf = html2pdfModule.default || html2pdfModule

            const opt = {
                margin: 5,
                filename: `Report_${data.name.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.95 },
                html2canvas: {
                    scale: 1.2, // Conservative scale for stability
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    windowWidth: 1440
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
            }

            // 4. Run the worker
            await html2pdf().set(opt).from(element).save()

            // 5. Cleanup
            document.body.classList.remove('pdf-export-active')
            document.head.removeChild(styleTag)

        } catch (error) {
            console.error("PDF Generation Error:", error)
            alert("Maaf, proses PDF terhenti karena beban gambar terlalu berat. Silakan gunakan tombol 'Print Report' lalu pilih 'Save as PDF' sebagai alternatif paling stabil.")

            // Full cleanup on error
            document.body.classList.remove('pdf-export-active')
            const styleIds = document.querySelectorAll('style')
            styleIds.forEach(s => {
                if (s.innerHTML.includes('pdf-export-active')) {
                    try { document.head.removeChild(s) } catch (e) { }
                }
            })
        } finally {
            setIsDownloading(false)
        }
    }

    const handleSendTelegram = async () => {
        try {
            setIsDownloading(true)
            setSendSuccess(false)
            await sendTelegramReport(data, telegramTarget)
            setSendSuccess(true)
            setTimeout(() => setSendSuccess(false), 3000)
        } catch (error: any) {
            console.error("Telegram error:", error)
            alert(error.message || "Gagal mengirim ke Telegram")
        } finally {
            setIsDownloading(false)
        }
    }

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
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-xl z-[100] flex justify-center items-center overflow-hidden p-0 sm:p-4 print:p-0 print:bg-white print:static print:block">
            <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-[1440px] h-full sm:h-auto max-h-[98vh] flex flex-col overflow-hidden print:max-h-none print:h-auto print:shadow-none print:rounded-none print:w-full">

                {/* Top Action Bar */}
                <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-white print:hidden">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <TrendingUp className="text-white" size={14} />
                        </div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">Project Analytical Engine v2.1</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setTelegramTarget('private')}
                                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all flex items-center gap-1 ${telegramTarget === 'private' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <UserIcon size={12} />
                                Private
                            </button>
                            <button
                                onClick={() => setTelegramTarget('group')}
                                className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all flex items-center gap-1 ${telegramTarget === 'group' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Users size={12} />
                                Group
                            </button>
                        </div>

                        <button
                            onClick={handleSendTelegram}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${sendSuccess ? 'bg-green-600 shadow-green-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white`}
                        >
                            {isDownloading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : sendSuccess ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <Send size={14} />
                            )}
                            {isDownloading ? 'Sending...' : sendSuccess ? 'Report Sent!' : 'Send Telegram Report'}
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Main Container */}
                <div id="report-content" className="flex-1 overflow-y-auto print:overflow-visible bg-[#F8FAFC] p-4 sm:p-6 space-y-5">
                    {mode === 'single' ? (
                        <div className="space-y-5">
                            {/* High-Contrast Header Section */}
                            <div className="bg-[#0F172A] text-white p-5 rounded-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/5 shadow-xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] -mr-16 -mt-16" />

                                <div className="relative z-10 flex flex-col gap-1.5">
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.25em] bg-blue-500/30 text-blue-300 border border-blue-400/30 w-fit">
                                        Active Deployment
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight uppercase text-white truncate max-w-[700px] drop-shadow-md">
                                        {data.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-blue-400" />
                                            <span>{data.status || 'ACTIVE'}</span>
                                        </div>
                                        <span className="text-white/20">•</span>
                                        <span>{reportDate}</span>
                                    </div>
                                </div>

                                <div className="relative z-10 flex items-center gap-6 bg-white/5 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/10 shadow-2xl shrink-0">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Total Coverage</p>
                                        <p className="text-2xl font-black text-white leading-none tracking-tighter">
                                            {(data.routes?.reduce((acc: number, r: any) => acc + r.length, 0) || 0).toFixed(2)}
                                            <span className="text-[11px] ml-1 text-blue-400 font-black">KM</span>
                                        </p>
                                    </div>
                                    <div className="h-10 w-px bg-white/10" />
                                    <div className="w-32">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Progress</span>
                                            <span className="text-2xl font-black text-blue-400 leading-none">{data.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
                                            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]" style={{ width: `${data.progress || 0}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MAIN CONTENT GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                                {/* LEFT COLUMN (POW + DAILY) */}
                                <div className="lg:col-span-4 space-y-5">
                                    {/* Execution Timeline */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2.5 px-1 border-l-4 border-blue-600 pl-3">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Execution Milestones</h3>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Priority Progression</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {filteredPowTasks?.map((task: any) => (
                                                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-black text-slate-800 text-[11px] leading-tight flex-1 pr-3 uppercase">
                                                            {task.task_name}
                                                        </h4>
                                                        <span className="text-[11px] font-black text-blue-700">{task.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${task.progress}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Daily Feedback Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2.5 px-1 border-l-4 border-indigo-600 pl-3">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Daily Snapshot</h3>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Latest Site Feed</p>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
                                            {data.dailyReport ? (
                                                <div className="flex flex-col">
                                                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4">
                                                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Operational Pulse</span>
                                                        <span className="text-[9px] font-black text-blue-400 tracking-wider">
                                                            {new Date(data.dailyReport.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="space-y-1.5">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">Today Activity</p>
                                                            <p className="text-xs font-black text-slate-900 leading-normal border-l-3 border-blue-500 pl-3 bg-blue-50/30 py-1.5 rounded-r-lg">
                                                                {data.dailyReport.today_activity}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">Next Plan</p>
                                                            <p className="text-xs font-bold text-slate-600 italic leading-normal border-l-3 border-slate-300 pl-3">
                                                                {data.dailyReport.tomorrow_plan}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Site Lead</p>
                                                                <p className="text-[10px] font-black text-slate-800 uppercase truncate">{data.dailyReport.executor_name || 'System'}</p>
                                                            </div>
                                                            <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Manpower</p>
                                                                <p className="text-[10px] font-black text-slate-900">{data.dailyReport.manpower_count || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-10 text-center bg-slate-50/80">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Awaiting Daily Sync</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN (MATERIALS GRID) */}
                                <div className="lg:col-span-8 space-y-3">
                                    <div className="flex items-center gap-2.5 px-1 border-l-4 border-slate-800 pl-3">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Material Inventory Intelligence</h3>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Live Stock & Scope Variance</p>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-slate-100">
                                            {data.materialSummary.map((m: any) => (
                                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-blue-50/20 transition-all group">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="font-black text-slate-900 text-[11px] uppercase tracking-tight truncate leading-tight group-hover:text-blue-600 transition-colors">{m.name}</div>
                                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{m.unit}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 mb-1">
                                                            <span className="opacity-60">{m.quantity_needed || 0}</span>
                                                            <span className="opacity-20">/</span>
                                                            <span className="text-blue-600">{m.total_out || 0}</span>
                                                        </div>
                                                        <div className={`text-[12px] font-black px-2.5 py-1 rounded-lg flex items-center gap-2 ${((m.quantity_needed || 0) - (m.total_out || 0)) <= 0 ? 'text-red-700 bg-red-100 shadow-[inset_0_0_10px_rgba(220,38,38,0.1)]' : 'text-slate-900 bg-slate-200 shadow-sm'}`}>
                                                            {Math.max(0, (m.quantity_needed || 0) - (m.total_out || 0))}
                                                            <span className="text-[8px] tracking-widest opacity-60">SISA</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {data.materialSummary.length === 0 && (
                                            <div className="p-12 text-center bg-slate-50/50">
                                                <Package className="mx-auto text-slate-200 mb-3" size={32} />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Database Null</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        /* Global Portfolio Analysis */
                        <div className="p-4 space-y-6">
                            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-4">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Portfolio Matrix</h1>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px]">Consolidated Tactical Engine</p>
                                </div>
                                <div className="text-right p-4 px-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/5">
                                    <p className="text-[9px] uppercase font-black text-slate-500 mb-1 tracking-widest text-center">Active Nodes</p>
                                    <p className="text-3xl font-black leading-none text-center">{(data as any[]).length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.15em]">
                                            <th className="px-8 py-5 opacity-50">#</th>
                                            <th className="px-8 py-5">Global Designation</th>
                                            <th className="px-8 py-5 text-right opacity-80">Execution Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(data as any[]).map((p, i) => (
                                            <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                                                <td className="px-8 py-5 text-xs font-black text-slate-300 group-hover:text-blue-200">{String(i + 1).padStart(2, '0')}</td>
                                                <td className="px-8 py-5">
                                                    <div className="font-black text-slate-900 text-base uppercase tracking-tight truncate max-w-[500px] group-hover:text-blue-700 transition-colors">{p.name}</div>
                                                    <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{p.status || 'OPERATIONAL'}</div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-6 text-right">
                                                        <div className="w-40 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 group-hover:border-blue-200 transition-all">
                                                            <div className="bg-blue-600 h-full rounded-full group-hover:bg-blue-500 transition-all" style={{ width: `${p.progress || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-blue-700 text-2xl w-14 leading-none tracking-tighter">{p.progress || 0}%</span>
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

                {/* Cyberdeck Footer Bar */}
                <div className="px-6 py-2.5 bg-[#0F172A] text-white flex justify-between items-center text-[8px] tracking-[0.25em] uppercase font-black shrink-0 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={12} className="text-blue-400" />
                        <span className="opacity-90">Analytical State // Gravity Network Protocol 4.0</span>
                    </div>
                    <div className="opacity-40">
                        &copy; {new Date().getFullYear()} &bull; Operational Data Record Sync
                    </div>
                </div>
            </div>
        </div>
    )
}
