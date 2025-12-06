
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    subtext?: string
}

export default function StatsCard({ label, value, icon: Icon, subtext }: StatsCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    )
}
