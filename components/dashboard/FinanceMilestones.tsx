'use client'

import { useEffect, useState } from 'react'
import { getProjectMilestones, createMilestone, updateMilestonePayment, calculateProjectProgress } from '@/app/actions/finance-actions'
import { CheckCircle2, Clock, AlertCircle, Plus, DollarSign, Calculator, Landmark } from 'lucide-react'

interface FinanceMilestonesProps {
    projectId: string
    projectValue: number
    mandorValue?: number
}

export default function FinanceMilestones({ projectId, projectValue, mandorValue }: FinanceMilestonesProps) {
    const [milestones, setMilestones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState({ fieldProgress: 0, totalProgress: 0 })
    const [showAddModal, setShowAddModal] = useState(false)
    const [newMilestone, setNewMilestone] = useState({
        label: '',
        percentage: '',
        trigger_condition: 'manual',
        trigger_value: '',
        type: 'IN' as 'IN' | 'OUT'
    })

    const loadData = async () => {
        if (!projectId || projectId === 'all') return
        setLoading(true)
        const [milestoneData, progressData] = await Promise.all([
            getProjectMilestones(projectId),
            calculateProjectProgress(projectId)
        ])
        setMilestones(milestoneData)
        setProgress(progressData)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [projectId])

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault()
        const percentage = Number(newMilestone.percentage)
        // Use Mandor Value for OUT milestones, Project Value for IN milestones
        const baseValue = newMilestone.type === 'OUT' ? (mandorValue || 0) : (projectValue || 0)
        const amount = (baseValue * percentage) / 100

        const result = await createMilestone({
            project_id: projectId,
            ...newMilestone,
            percentage,
            amount,
            trigger_value: newMilestone.trigger_value ? Number(newMilestone.trigger_value) : null
        })

        if (result.success) {
            setShowAddModal(false)
            setNewMilestone({ label: '', percentage: '', trigger_condition: 'manual', trigger_value: '', type: 'IN' })
            loadData()
        } else {
            alert('Gagal menambah termin: ' + result.error)
        }
    }

    const togglePaid = async (milestoneId: string, currentPaid: boolean) => {
        const result = await updateMilestonePayment(milestoneId, !currentPaid)
        if (result.success) loadData()
    }

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val)
    }

    if (!projectId || projectId === 'all') {
        return (
            <div className="p-20 text-center text-gray-500 italic flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <Calculator size={32} className="text-gray-600" />
                </div>
                <p>Silakan pilih proyek spesifik di filter atas untuk mengelola termin pembayaran.</p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Project Progress Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0F172A]/80 p-4 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status Progres Lapangan (RO)</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-black text-white">{progress.fieldProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${progress.fieldProgress}%` }}></div>
                    </div>
                </div>
                <div className="bg-[#0F172A]/80 p-4 rounded-xl border border-gray-700/50">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status Progres Keseluruhan</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-black text-white">{progress.totalProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${progress.totalProgress}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                    <Landmark size={14} className="text-blue-500" />
                    Daftar Batas Tagihan (Milestones)
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <Plus size={14} /> Tambah Termin
                </button>
            </div>

            {loading ? (
                <div className="py-10 text-center animate-pulse text-gray-500">Memuat termin...</div>
            ) : milestones.length === 0 ? (
                <div className="py-10 text-center text-gray-600 italic border-2 border-dashed border-gray-800 rounded-2xl">
                    Belum ada termin yang diatur untuk proyek ini.
                </div>
            ) : (
                <div className="space-y-4">
                    {milestones.map((m) => {
                        const isTriggered =
                            m.trigger_condition === 'field_progress' ? progress.fieldProgress >= m.trigger_value :
                                m.trigger_condition === 'total_progress' ? progress.totalProgress >= m.trigger_value :
                                    m.trigger_condition === 'status' ? false : true;

                        return (
                            <div
                                key={m.id}
                                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${m.is_paid ? 'bg-green-500/5 border-green-500/20' : isTriggered ? 'bg-blue-500/5 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-gray-800/20 border-gray-800'}`}
                            >
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.is_paid ? 'bg-green-500/20 text-green-400' : isTriggered ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                                        {m.is_paid ? <CheckCircle2 size={24} /> : isTriggered ? <DollarSign size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-bold text-white truncate">{m.label}</h4>
                                            <div className="flex gap-1 items-center">
                                                <span className="text-[10px] font-black px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">{m.percentage}%</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.type === 'OUT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                    {m.type === 'OUT' ? 'MANDOR' : 'CLIENT'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Trigger: {m.trigger_condition === 'manual' ? 'Manual' : `${m.trigger_condition === 'field_progress' ? 'RO' : 'Total'} Progres ${m.trigger_value}%`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-800/50">
                                    <div className="text-left sm:text-right">
                                        <p className={`text-xl font-black ${m.type === 'OUT' ? 'text-red-400' : 'text-white'}`}>{formatIDR(m.amount)}</p>
                                        {m.is_paid ? (
                                            <p className="text-[9px] font-bold text-green-600 uppercase">DIBAYAR: {new Date(m.paid_at).toLocaleDateString('id-ID')}</p>
                                        ) : (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isTriggered ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></div>
                                                <span className={`text-[10px] font-bold ${isTriggered ? 'text-blue-400' : 'text-gray-500'}`}>
                                                    {isTriggered ? (m.type === 'OUT' ? 'SIAP BAYAR' : 'SIAP TAGIH') : 'WAITING'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => togglePaid(m.id, m.is_paid)}
                                        className={`mt-2 sm:mt-1 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 ${m.is_paid ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'}`}
                                    >
                                        {m.is_paid ? 'BATAL' : 'CAIRKAN'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Milestone Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300">
                    <div className="bg-[#1E293B] border-t sm:border border-gray-700/50 rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 overflow-hidden">
                        <form onSubmit={handleAddMilestone} className="flex flex-col h-full">
                            <div className="p-6 border-b border-gray-700/30 bg-gray-900/40 flex justify-between items-center">
                                <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                        <Plus className="text-blue-400" size={18} />
                                    </div>
                                    Tambah Termin Baru
                                </h3>
                                <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-800/50 rounded-full text-gray-500 transition-colors">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">LABEL TERMIN</label>
                                        <input
                                            type="text" required
                                            value={newMilestone.label}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, label: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700/50 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700 font-bold"
                                            placeholder="Contoh: DP 30%, BAST, dll"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">PERSENTASE (%)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" required
                                                    value={newMilestone.percentage}
                                                    onChange={(e) => setNewMilestone({ ...newMilestone, percentage: e.target.value })}
                                                    className="w-full bg-[#0F172A] border border-gray-700/50 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-bold"
                                                    placeholder="30"
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 font-black">%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">TIPE TERMIN</label>
                                            <div className="relative">
                                                <select
                                                    value={newMilestone.type}
                                                    onChange={(e) => setNewMilestone({ ...newMilestone, type: e.target.value as 'IN' | 'OUT' })}
                                                    className="w-full bg-[#0F172A] border border-gray-700/50 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer font-bold"
                                                >
                                                    <option value="IN">Revenue (Basis: Total Project)</option>
                                                    <option value="OUT">Mandor (Basis: Project Mandor)</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                    <Calculator size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-8 bg-blue-500/30 rounded-full" />
                                            <div>
                                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider">Basis Perhitungan</p>
                                                <p className="text-sm text-blue-400 font-black">{formatIDR(newMilestone.type === 'OUT' ? (mandorValue || 0) : (projectValue || 0))}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">PEMICU (TRIGGER)</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="relative">
                                            <select
                                                value={newMilestone.trigger_condition}
                                                onChange={(e) => setNewMilestone({ ...newMilestone, trigger_condition: e.target.value })}
                                                className="w-full bg-[#0F172A] border border-gray-700/50 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer font-bold"
                                            >
                                                <option value="manual">Input Manual</option>
                                                <option value="field_progress">Berdasarkan RO Progress (%)</option>
                                                <option value="total_progress">Berdasarkan Total Progress (%)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <Clock size={14} />
                                            </div>
                                        </div>

                                        {newMilestone.trigger_condition !== 'manual' && (
                                            <div className="relative animate-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="number" required
                                                    value={newMilestone.trigger_value}
                                                    onChange={(e) => setNewMilestone({ ...newMilestone, trigger_value: e.target.value })}
                                                    className="w-full bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black placeholder:text-blue-900"
                                                    placeholder="Target Progres (%)"
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400 font-black">%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-900/60 border-t border-gray-700/30 flex items-center gap-4 pb-10 sm:pb-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-4 text-gray-500 hover:text-white font-black transition-colors text-xs uppercase"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-950/50 hover:bg-blue-500 active:scale-95 transition-all text-xs uppercase tracking-[0.1em]"
                                >
                                    Simpan Termin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
