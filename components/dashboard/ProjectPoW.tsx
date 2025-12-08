'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { getPowTasks, createPowTask, updatePowTask, deletePowTask, updateTaskProgress } from '@/app/actions/pow-actions'

interface Props {
    projectId: string
    onUpdate?: () => void
}

export default function ProjectPoW({ projectId, onUpdate }: Props) {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<any>(null)

    // Form state
    const [formData, setFormData] = useState({
        task_name: '',
        description: '',
        start_date: '',
        end_date: '',
        duration_days: 0,
        progress: 0,
        status: 'not-started',
        assigned_to: '',
        estimated_cost: 0
    })

    useEffect(() => {
        loadTasks()
    }, [projectId])

    async function loadTasks() {
        setLoading(true)
        const data = await getPowTasks(projectId)
        setTasks(data)
        setLoading(false)
    }

    function openModal(task?: any) {
        if (task) {
            setEditingTask(task)
            setFormData({
                task_name: task.task_name,
                description: task.description || '',
                start_date: task.start_date || '',
                end_date: task.end_date || '',
                duration_days: task.duration_days || 0,
                progress: task.progress || 0,
                status: task.status || 'not-started',
                assigned_to: task.assigned_to || '',
                estimated_cost: task.estimated_cost || 0
            })
        } else {
            setEditingTask(null)
            setFormData({
                task_name: '',
                description: '',
                start_date: '',
                end_date: '',
                duration_days: 0,
                progress: 0,
                status: 'not-started',
                assigned_to: '',
                estimated_cost: 0
            })
        }
        setIsModalOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (editingTask) {
            await updatePowTask(editingTask.id, projectId, formData)
        } else {
            await createPowTask(projectId, { ...formData, order_index: tasks.length })
        }

        setIsModalOpen(false)
        loadTasks()
        onUpdate?.()
    }

    async function handleDelete(taskId: string) {
        if (!confirm('Are you sure you want to delete this task?')) return
        await deletePowTask(taskId, projectId)
        loadTasks()
        onUpdate?.()
    }

    async function handleProgressChange(taskId: string, progress: number) {
        await updateTaskProgress(taskId, projectId, progress)
        loadTasks()
        onUpdate?.()
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            'not-started': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'completed': 'bg-green-500/10 text-green-400 border-green-500/20',
            'delayed': 'bg-red-500/10 text-red-400 border-red-500/20'
        }
        const icons = {
            'not-started': Clock,
            'in-progress': TrendingUp,
            'completed': CheckCircle2,
            'delayed': AlertCircle
        }
        const Icon = icons[status as keyof typeof icons] || Clock

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
                <Icon size={12} />
                {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        )
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const totalProgress = tasks.length > 0
        ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
        : 0

    return (
        <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-white mb-1">Plan of Work (PoW)</h3>
                    <p className="text-sm text-gray-400">
                        {tasks.length} tasks • Overall Progress: <span className="text-blue-400 font-semibold">{totalProgress}%</span>
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus size={16} /> Add Task
                </button>
            </div>

            {/* Timeline Visualization */}
            {tasks.length > 0 && (
                <div className="p-6 bg-[#0F172A] border-b border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-4">Timeline Overview</h4>
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div key={task.id} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">{task.task_name}</span>
                                    <span className="text-gray-500">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${task.status === 'completed' ? 'bg-green-500' :
                                            task.status === 'in-progress' ? 'bg-blue-500' :
                                                task.status === 'delayed' ? 'bg-red-500' :
                                                    'bg-gray-600'
                                            }`}
                                        style={{ width: `${task.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Task List */}
            {loading ? (
                <div className="p-8 text-center text-gray-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-gray-400 font-medium">No tasks added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create your first task to start planning.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0F172A] text-gray-400 font-medium border-b border-gray-700">
                            <tr>
                                <th className="px-4 py-3">Task Name</th>
                                <th className="px-4 py-3">Duration</th>
                                <th className="px-4 py-3">Start Date</th>
                                <th className="px-4 py-3">End Date</th>
                                <th className="px-4 py-3">Progress</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-white font-medium">{task.task_name}</p>
                                            {task.description && (
                                                <p className="text-xs text-gray-500 truncate max-w-xs">{task.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{task.duration_days} days</td>
                                    <td className="px-4 py-3 text-gray-400">{formatDate(task.start_date)}</td>
                                    <td className="px-4 py-3 text-gray-400">{formatDate(task.end_date)}</td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={task.progress}
                                            onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                                            className="w-24 accent-blue-500"
                                        />
                                        <span className="ml-2 text-xs text-gray-400">{task.progress}%</span>
                                    </td>
                                    <td className="px-4 py-3">{getStatusBadge(task.status)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(task)}
                                                className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-900/20"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#1E293B] rounded-xl border border-gray-700 w-full max-w-2xl shadow-2xl">
                        <div className="p-4 border-b border-gray-700">
                            <h3 className="font-bold text-white">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Task Category (Quick Select)</label>
                                    <select
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setFormData({ ...formData, task_name: e.target.value })
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="">-- Select from template --</option>
                                        <optgroup label="1. PREPARING">
                                            <option value="1.2 Kick Off Meeting (KOM)">1.2 Kick Off Meeting (KOM)</option>
                                            <option value="1.3 Survey">1.3 Survey</option>
                                            <option value="1.4 Design Review Meeting (DRM)">1.4 Design Review Meeting (DRM)</option>
                                        </optgroup>
                                        <optgroup label="2. MATERIAL DELIVERY">
                                            <option value="2.1 Fabrikasi Material">2.1 Fabrikasi Material</option>
                                            <option value="2.2 Delivery Material HDPE">2.2 Delivery Material HDPE</option>
                                            <option value="2.3 Delivery Material Kabel">2.3 Delivery Material Kabel</option>
                                            <option value="2.4 Delivery Material Tiang">2.4 Delivery Material Tiang</option>
                                        </optgroup>
                                        <optgroup label="3. INSTALASI & COMMISSIONING TEST">
                                            <option value="3.1 Pengurusan Ijin Kerja">3.1 Pengurusan Ijin Kerja</option>
                                            <option value="3.2 Penggalian Tanah dan Penanaman HDPE">3.2 Penggalian Tanah dan Penanaman HDPE</option>
                                            <option value="3.3 Penanaman Tiang dan Pembuatan HH">3.3 Penanaman Tiang dan Pembuatan HH</option>
                                            <option value="3.4 Penarikan Kabel Duct">3.4 Penarikan Kabel Duct</option>
                                            <option value="3.5 Joint dan Terminasi">3.5 Joint dan Terminasi</option>
                                            <option value="3.6 Test Commisioning">3.6 Test Commisioning</option>
                                        </optgroup>
                                        <optgroup label="4. CLOSING">
                                            <option value="4.1 ATP">4.1 ATP</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Task Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.task_name}
                                        onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        rows={2}
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Duration (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.duration_days}
                                        onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                                    <select
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="not-started">Not Started</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="delayed">Delayed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Assigned To</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.assigned_to}
                                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Progress (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-[#0F172A] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.progress}
                                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    {editingTask ? 'Update Task' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
