
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    subtext?: string
}

export default function StatsCard({ label, value, icon: Icon, subtext }: StatsCardProps) {
    return (
        <div className="bg-[#1E293B] p-4 rounded-lg shadow-sm border border-gray-700 flex items-start gap-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm text-gray-400 font-medium">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
                {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    )
}
