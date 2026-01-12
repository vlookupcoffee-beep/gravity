'use client'

import { useEffect, useState } from 'react'
import { getProjectMilestones, createMilestone, updateMilestonePayment, calculateProjectProgress } from '@/app/actions/finance-actions'
import { CheckCircle2, Clock, AlertCircle, Plus, DollarSign, Calculator, Landmark } from 'lucide-react'

export default function FinanceMilestones({ projectId, projectValue }: { projectId: string, projectValue: number }) {
    const [milestones, setMilestones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState({ fieldProgress: 0, totalProgress: 0 })
    const [showAddModal, setShowAddModal] = useState(false)
    const [newMilestone, setNewMilestone] = useState({
        label: '',
        percentage: '',
        trigger_condition: 'manual',
        trigger_value: ''
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
        const amount = (percentage / 100) * projectValue

        const result = await createMilestone({
            project_id: projectId,
            ...newMilestone,
            percentage,
            amount,
            trigger_value: newMilestone.trigger_value ? Number(newMilestone.trigger_value) : null
        })

        if (result.success) {
            setShowAddModal(false)
            setNewMilestone({ label: '', percentage: '', trigger_condition: 'manual', trigger_value: '' })
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
                <div className="space-y-3">
                    {milestones.map((m) => {
                        const isTriggered =
                            m.trigger_condition === 'field_progress' ? progress.fieldProgress >= m.trigger_value :
                                m.trigger_condition === 'total_progress' ? progress.totalProgress >= m.trigger_value :
                                    m.trigger_condition === 'status' ? false : true; // Manual always true or handled separately

                        return (
                            <div
                                key={m.id}
                                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${m.is_paid ? 'bg-green-500/5 border-green-500/20' : isTriggered ? 'bg-blue-500/5 border-blue-500/30' : 'bg-gray-800/20 border-gray-800'}`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.is_paid ? 'bg-green-500/20 text-green-400' : isTriggered ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                                        {m.is_paid ? <CheckCircle2 size={24} /> : isTriggered ? <DollarSign size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white">{m.label}</h4>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">{m.percentage}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Trigger: {m.trigger_condition === 'manual' ? 'Manual' : `${m.trigger_condition === 'field_progress' ? 'RO' : 'Total'} Progres ${m.trigger_value}%`}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-lg font-black text-white">{formatIDR(m.amount)}</p>
                                    {m.is_paid ? (
                                        <p className="text-[10px] font-bold text-green-500 transition-all">DIBAYAR PADA {new Date(m.paid_at).toLocaleDateString('id-ID')}</p>
                                    ) : (
                                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded ${isTriggered ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                                            {isTriggered ? 'SIAP DITAGIH' : 'MENUNGGU PROGRES'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => togglePaid(m.id, m.is_paid)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${m.is_paid ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-green-600 text-white hover:bg-green-500'}`}
                                >
                                    {m.is_paid ? 'Batalkan Bayar' : 'Tandai Cair'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Milestone Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <form onSubmit={handleAddMilestone}>
                            <div className="p-6 border-b border-gray-700">
                                <h3 className="text-xl font-bold text-white">Tambah Termin Baru</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Label</label>
                                    <input
                                        type="text" required
                                        value={newMilestone.label}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, label: e.target.value })}
                                        className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                                        placeholder="Contoh: DP 30%, BAST, dll"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Persentase (%)</label>
                                        <input
                                            type="number" required
                                            value={newMilestone.percentage}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, percentage: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                                            placeholder="30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trigger</label>
                                        <select
                                            value={newMilestone.trigger_condition}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, trigger_condition: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                                        >
                                            <option value="manual">Manual</option>
                                            <option value="field_progress">RO Progress</option>
                                            <option value="total_progress">Total Progress</option>
                                        </select>
                                    </div>
                                </div>
                                {newMilestone.trigger_condition !== 'manual' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ambang Batas Progres (%)</label>
                                        <input
                                            type="number" required
                                            value={newMilestone.trigger_value}
                                            onChange={(e) => setNewMilestone({ ...newMilestone, trigger_value: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                                            placeholder="Contoh: 60"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-[#0F172A]/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 font-bold hover:text-white transition">Batal</button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-95 transition-all">Simpan Termin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
