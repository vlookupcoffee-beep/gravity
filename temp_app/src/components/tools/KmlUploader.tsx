
'use client'

import { useState } from 'react'
import { processKmlUpload } from '@/app/actions/upload-kml'
import { Upload, FileUp, Loader2 } from 'lucide-react'

export default function KmlUploader() {
    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<string>('')

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setStatus('Uploading and processing...')

        const formData = new FormData()
        formData.append('file', file)

        const result = await processKmlUpload(formData)

        setIsUploading(false)
        if (result.error) {
            setStatus('Error: ' + result.error)
        } else {
            setStatus(`Success! Imported ${result.counts?.structures} structures and ${result.counts?.routes} routes.`)
            // Ideally refresh the map here
            window.location.reload()
        }
    }

    return (
        <div className="relative">
            <input
                type="file"
                accept=".kml"
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
            />
            <button className={`flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition ${isUploading ? 'opacity-70' : ''}`}>
                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                {isUploading ? 'Processing...' : 'Upload KML'}
            </button>
            {status && (
                <div className="absolute top-12 right-0 bg-white p-2 rounded shadow text-sm whitespace-nowrap z-50">
                    {status}
                </div>
            )}
        </div>
    )
}
