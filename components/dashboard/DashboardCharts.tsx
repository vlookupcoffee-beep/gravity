'use client'

import React from 'react'
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface DashboardChartsProps {
    projects: any[]
}

export default function DashboardCharts({ projects }: DashboardChartsProps) {
    // Process Data for Bar Chart: Progress per project
    const barData = projects
        .slice(0, 8) // Show top 8 for clarity
        .map(p => ({
            name: `SITE-${p.id.slice(0, 4).toUpperCase()}`,
            fullName: p.name,
            progress: p.progress || 0
        }))

    // Process Data for Pie Chart: Status distribution
    const statusCounts = projects.reduce((acc: any, p) => {
        const s = p.status || 'Active'
        acc[s] = (acc[s] || 0) + 1
        return acc
    }, {})

    const pieData = Object.keys(statusCounts).map(k => ({
        name: k.toUpperCase(),
        value: statusCounts[k]
    }))

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Project Progress Bar Chart */}
            <div className="lg:col-span-2 bg-[#1E293B]/40 backdrop-blur-md p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                        Veloistas Proyek
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#3B82F6' }}
                            />
                            <Bar
                                dataKey="progress"
                                fill="url(#barGradient)"
                                radius={[6, 6, 0, 0]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Portfolio Status Pie Chart */}
            <div className="bg-[#1E293B]/40 backdrop-blur-md p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                        Fluktuasi Portofolio
                    </h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #374151', borderRadius: '12px', fontSize: '10px' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', color: '#9ca3af' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
