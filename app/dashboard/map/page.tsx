'use client'

import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import KmlUploader from '@/components/tools/KmlUploader'

return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading Map...</div>}>
        <MapContent />
    </Suspense>
)
}
