'use client'

import { useEffect, useState } from 'react'
import { getExpenses, getProjectMilestones, createExpense, createMilestone, updateMilestonePayment } from '@/app/actions/finance-actions'
import { getProjects } from '@/app/actions/get-projects'
import { getCurrentUser } from '@/app/actions/auth-actions'
import { Wallet, TrendingUp, CreditCard, ArrowDownCircle, ArrowUpCircle, Plus, Filter, Search, Calendar, Landmark } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import FinanceMilestones from '@/components/dashboard/FinanceMilestones'

export default function FinancePage() {
    const [projects, setProjects] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'expenses' | 'milestones'>('expenses')
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all')

    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Material',
        description: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0]
    })

    const loadData = async () => {
        setLoading(true)
        const [projectsData, expensesData, userData] = await Promise.all([
            getProjects(),
            getExpenses(selectedProjectId === 'all' ? undefined : selectedProjectId),
            getCurrentUser()
        ])
        setProjects(projectsData)
        setExpenses(expensesData)
        setUser(userData)
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [selectedProjectId])

    const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
    const totalProjectValue = projects.reduce((acc, p) => acc + (Number(p.value) || 0), 0)

    // Formatting currency
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val)
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        const result = await createExpense({
            ...newExpense,
            amount: Number(newExpense.amount)
        })
        if (result.success) {
            setShowExpenseModal(false)
            setNewExpense({
                amount: '',
                category: 'Material',
                description: '',
                project_id: '',
                date: new Date().toISOString().split('T')[0]
            })
            loadData()
        } else {
            alert('Gagal menambah pengeluaran: ' + result.error)
        }
    }

    if (user && user.role !== 'owner') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <Landmark size={64} className="text-gray-700 mb-4" />
                <h1 className="text-2xl font-bold">Akses Terbatas</h1>
                <p className="text-gray-400">Halaman ini hanya dapat diakses oleh Owner.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <Wallet className="text-blue-500" />
                        Manajemen Keuangan
                    </h1>
                    <p className="text-gray-400 mt-1 font-medium italic">Monitor arus kas dan profitabilitas proyek Anda.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 active:scale-95 border border-blue-400/20"
                    >
                        <Plus size={18} />
                        <span className="font-semibold text-sm">Catat Pengeluaran</span>
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatsCard
                    label="Total Nilai Proyek"
                    value={formatIDR(totalProjectValue)}
                    icon={TrendingUp}
                    className="bg-gradient-to-br from-[#1E293B] to-[#0F172A]"
                />
                <StatsCard
                    label="Total Pengeluaran"
                    value={formatIDR(totalExpenses)}
                    icon={ArrowDownCircle}
                    className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-red-500/10"
                />
                <StatsCard
                    label="Cash In (Estimasi)"
                    value={formatIDR(0)} // Placeholder for paid milestones
                    icon={ArrowUpCircle}
                    className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-green-500/10"
                />
                <StatsCard
                    label="Estimasi Profit"
                    value={formatIDR(totalProjectValue - totalExpenses)}
                    icon={CreditCard}
                    className="bg-gradient-to-br from-blue-950/40 to-[#0F172A] border-blue-500/20"
                />
            </div>

            {/* Main Content Area */}
            <div className="bg-[#1E293B]/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
                {/* Tabs & Filters */}
                <div className="p-6 border-b border-gray-700/50 bg-[#1E293B]/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex p-1 bg-[#0F172A]/80 rounded-xl border border-gray-700/30">
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Daftar Pengeluaran
                        </button>
                        <button
                            onClick={() => setActiveTab('milestones')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'milestones' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Termin Pembayaran
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full bg-[#0F172A]/80 border border-gray-700/50 text-white rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Proyek</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="font-medium animate-pulse">Memuat data keuangan...</p>
                    </div>
                ) : activeTab === 'expenses' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="bg-[#0F172A]/80 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4 border-b border-gray-700/50">Tanggal</th>
                                    <th className="px-6 py-4 border-b border-gray-700/50">Proyek</th>
                                    <th className="px-6 py-4 border-b border-gray-700/50">Kategori</th>
                                    <th className="px-6 py-4 border-b border-gray-700/50">Deskripsi</th>
                                    <th className="px-6 py-4 border-b border-gray-700/50 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">Belum ada catatan pengeluaran.</td>
                                    </tr>
                                ) : (
                                    expenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4 text-white font-bold">{exp.projects?.name || 'Overhead'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold uppercase border border-blue-500/20">
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 italic">"{exp.description}"</td>
                                            <td className="px-6 py-4 text-right font-bold text-red-400">{formatIDR(exp.amount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <FinanceMilestones
                        projectId={selectedProjectId}
                        projectValue={projects.find(p => p.id === selectedProjectId)?.value || 0}
                    />
                )}
            </div>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleCreateExpense}>
                            <div className="p-6 border-b border-gray-700">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ArrowDownCircle className="text-red-400" />
                                    Catat Pengeluaran Baru
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Proyek (Opsional)</label>
                                        <select
                                            value={newExpense.project_id}
                                            onChange={(e) => setNewExpense({ ...newExpense, project_id: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        >
                                            <option value="">-- Pengeluaran Umum / Office --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nominal (IDR)</label>
                                        <input
                                            type="number"
                                            required
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Misal: 50000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal</label>
                                        <input
                                            type="date"
                                            required
                                            value={newExpense.date}
                                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Kategori</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Material', 'Gaji', 'BBM/Transport', 'Konsumsi', 'Alat', 'Lainnya'].map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setNewExpense({ ...newExpense, category: cat })}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${newExpense.category === cat ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Deskripsi / Catatan</label>
                                        <textarea
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                            className="w-full bg-[#0F172A] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                            placeholder="Tulis detail pengeluaran..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#0F172A]/50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-6 py-2.5 text-gray-400 hover:text-white font-bold transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold transition shadow-lg shadow-red-900/20 active:scale-95 border border-red-500/20"
                                >
                                    Simpan Pengeluaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
