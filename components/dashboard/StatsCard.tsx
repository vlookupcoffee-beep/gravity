
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    subtext?: string
    className?: string
}

export default function StatsCard({ label, value, icon: Icon, subtext, className }: StatsCardProps) {
    return (
        <div className={`bg-[#1E293B] p-4 rounded-xl shadow-sm border border-gray-700 flex items-center gap-4 hover:border-blue-500/50 transition duration-300 ${className}`}>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm text-gray-400 font-medium mb-1">{label}</p>
                {/* 
                   User Requirement: "Jangan di buat wrapping memanjang aja namun terlihat semua dengan jelas"
                   Solution: whitespace-nowrap + overflow-x-auto (but hiding scrollbar for standard view)
                   + text-xl (slightly smaller than 2xl) to fit easier.
                */}
                <div className="overflow-x-auto scrollbar-hide">
                    <p className="text-xl font-bold text-white whitespace-nowrap">
                        {value}
                    </p>
                </div>
                {subtext && <p className="text-xs text-gray-500 mt-1 truncate">{subtext}</p>}
            </div>
        </div>
    )
}
