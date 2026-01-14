
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
        <div className={`bg-[#1E293B]/40 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-700/50 flex items-center gap-4 hover:border-blue-500/30 transition-all duration-300 group ${className}`}>
            <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Icon size={24} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] mb-1">{label}</p>
                <div className="overflow-x-auto scrollbar-hide">
                    <p className="text-xl font-black text-white whitespace-nowrap tracking-tight">
                        {value}
                    </p>
                </div>
                {subtext && <p className="text-[10px] text-gray-500 mt-1 font-medium truncate uppercase tracking-widest">{subtext}</p>}
            </div>
        </div>
    )
}
