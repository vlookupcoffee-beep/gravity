'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Calendar, DollarSign, Type, AlignLeft, Info } from 'lucide-react'
import { createProject } from '@/app/actions/project-actions'

export default function NewProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await createProject(formData)

        if (result.success) {
            router.push(`/dashboard/projects/${result.projectId}`)
        } else {
            setError(result.error || 'Failed to create project')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/projects"
                    className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                    <p className="text-gray-400 text-sm">Add a new engineering project to your dashboard</p>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="space-y-6">

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <section className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 space-y-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <Info size={18} className="text-blue-400" />
                                Basic Information
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name *</label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="e.g. STO Magelang Fiber Deployment"
                                        className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                                <div className="relative">
                                    <AlignLeft className="absolute left-3 top-3 text-gray-500" size={16} />
                                    <textarea
                                        name="description"
                                        rows={4}
                                        placeholder="Describe the project scope..."
                                        className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 space-y-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <DollarSign size={18} className="text-green-400" />
                                Financials
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Value (IDR)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Rp</span>
                                    <input
                                        type="number"
                                        name="value"
                                        placeholder="0"
                                        min="0"
                                        className="w-full pl-8 pr-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <section className="bg-[#1E293B] p-6 rounded-xl border border-gray-700 space-y-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <Calendar size={18} className="text-orange-400" />
                                Schedule & Status
                            </h2>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                                <select
                                    name="status"
                                    className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                    defaultValue="planning"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="w-full px-4 py-2 bg-[#0F172A] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-800">
                    <Link
                        href="/dashboard/projects"
                        className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Create Project
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
