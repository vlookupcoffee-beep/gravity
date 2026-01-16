'use client'

import { X, Map as MapIcon, Upload } from 'lucide-react'
import { useState } from 'react'
import { updateProject } from '@/app/actions/project-actions'
import { updateProjectMap } from '@/app/actions/upload-kml'
import { PROJECT_STATUS_OPTIONS } from '@/utils/pow-constants'

interface EditProjectModalProps {
    project: any
    onClose: () => void
    onUpdate: () => void
}

export default function EditProjectModal({ project, onClose, onUpdate }: EditProjectModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states
    const [name, setName] = useState(project.name)
    const [description, setDescription] = useState(project.description || '')
    const [status, setStatus] = useState(project.status)
    const [value, setValue] = useState(project.value)
    const [startDate, setStartDate] = useState(project.start_date ? project.start_date.split('T')[0] : '')
    const [endDate, setEndDate] = useState(project.end_date ? project.end_date.split('T')[0] : '')
    const [mapFile, setMapFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('name', name)
        formData.append('description', description)
        formData.append('status', status)
        formData.append('value', value.toString())
        if (startDate) formData.append('start_date', startDate)
        if (endDate) formData.append('end_date', endDate)

        const result = await updateProject(project.id, formData)

        if (result.success) {
            // Handle Map Upload if file exists
            if (mapFile) {
                const mapData = new FormData()
                mapData.append('file', mapFile)
                await updateProjectMap(project.id, mapData)
            }
            onUpdate()
            onClose()
        } else {
            setError(result.error || 'Failed to update project')
        }
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-[#1E293B] rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Edit Project</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Status Project</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="planning">--- Pilih Status ---</option>
                                {PROJECT_STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Value (IDR)</label>
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(parseFloat(e.target.value))}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Update Map Layout (KML/KMZ)</label>
                            <div className="flex items-center gap-4 p-4 bg-[#0F172A] border border-gray-700 rounded-xl border-dashed">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <MapIcon size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 mb-2">Pilih file KML baru untuk memperbarui koordinat tiang dan jalur kabel.</p>
                                    <input
                                        type="file"
                                        accept=".kml,.kmz"
                                        className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                        onChange={(e) => setMapFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
