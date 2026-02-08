
'use client'

import React, { useEffect, useState } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import { getSCurveData, generateLinearPlan } from '@/app/actions/scurve-actions'
import { TrendingUp, AlertCircle, Sparkles } from 'lucide-react'

interface SCurveChartProps {
    projectId: string
}

export default function SCurveChart({ projectId }: SCurveChartProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const res = await getSCurveData(projectId)
            setData(res)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [projectId])

    const handleGenerate = async () => {
        try {
            await generateLinearPlan(projectId)
            await load()
        } catch (e: any) {
            alert(e.message)
        }
    }

    if (loading) return <div className="h-64 bg-gray-800/20 animate-pulse rounded-xl" />

    // Calculate Deviation
    const lastItem = data.length > 0 ? data[data.length - 1] : null
    const deviation = lastItem && lastItem.plan !== null && lastItem.actual !== null
        ? (lastItem.actual - lastItem.plan).toFixed(1)
        : null

    const isDelayed = deviation !== null && parseFloat(deviation) < -10

    return (
        <div className="bg-[#1E293B]/40 backdrop-blur-md p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={18} />
                        S-Curve Proyek
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Garis Realisasi vs Rencana</p>
                </div>

                {deviation !== null && (
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${isDelayed ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {isDelayed && <AlertCircle size={14} />}
                        <span className="text-xs font-black">DEV: {deviation}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{isDelayed ? 'Terlambat' : 'On Track'}</span>
                    </div>
                )}
            </div>

            <div className="h-[300px] w-full">
                {data.length === 0 || data.every(d => d.plan === null) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm gap-4">
                        <span className="italic">Belum ada data rencana (Plan) untuk S-Curve.</span>
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Sparkles size={14} /> Generate Rencana Linear
                        </button>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                tickFormatter={(str) => {
                                    const date = new Date(str)
                                    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                domain={[0, 100]}
                                unit="%"
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '0', paddingBottom: '20px' }}
                            />
                            <Line
                                name="Rencana (Plan)"
                                type="monotone"
                                dataKey="plan"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                connectNulls
                            />
                            <Line
                                name="Realisasi (Actual)"
                                type="monotone"
                                dataKey="actual"
                                stroke="#3B82F6"
                                strokeWidth={4}
                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#0F172A' }}
                                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
