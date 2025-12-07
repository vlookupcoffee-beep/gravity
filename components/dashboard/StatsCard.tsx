
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    subtext?: string
}

export default function StatsCard({ label, value, icon: Icon, subtext }: StatsCardProps) {
    return (
        <div className="bg-[#1E293B] p-4 rounded-xl shadow-sm border border-gray-700 flex items-center gap-4 hover:border-blue-500/50 transition duration-300">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                <Icon size={24} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-xl md:text-2xl font-bold text-white truncate" title={String(value)}>
                    {value}
                </p>
                {subtext && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtext}</p>}
            </div>
        </div>
    )
}
