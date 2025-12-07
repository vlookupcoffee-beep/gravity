'use client'

import { FileText, Trash2, Eye, Download, Upload } from 'lucide-react'

interface FileProps {
    files: any[]
}

export default function FileList({ files }: FileProps) {
    return (
        <div className="bg-[#1E293B] rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-white">Project Files</h3>
                <button className="text-sm text-blue-400 font-medium flex items-center gap-1 hover:text-blue-300 hover:underline">
                    <Upload size={16} /> Upload New
                </button>
            </div>
            {files.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    No files uploaded yet.
                </div>
            ) : (
                <div className="divide-y divide-gray-700">
                    {files.map((file) => (
                        <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded text-gray-400">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{file.name}</p>
                                    <p className="text-xs text-gray-500">{new Date(file.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-blue-400 rounded transition" title="Preview">
                                    <Eye size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-green-400 rounded transition" title="Download">
                                    <Download size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-400 rounded transition" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
