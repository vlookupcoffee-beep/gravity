'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncPowProgressWithMaterials } from './pow-sync-actions'

export async function getMaterials() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching materials:', error)
        return []
    }

    return data
}

export async function createMaterial(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const unit = formData.get('unit') as string
    const initialStock = parseFloat(formData.get('initial_stock') as string) || 0

    try {
        const { data, error } = await supabase
            .from('materials')
            .insert({
                name,
                description,
                unit,
                current_stock: initialStock
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating material:', error)
            return { success: false, error: error.message }
        }

        // If there's initial stock, record it as a transaction
        if (initialStock > 0) {
            await supabase.from('material_transactions').insert({
                material_id: data.id,
                transaction_type: 'IN',
                quantity: initialStock,
                notes: 'Initial stock'
            })
        }

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function addStock(formData: FormData) {
    const supabase = await createClient()

    const materialId = formData.get('material_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const notes = formData.get('notes') as string
    const projectId = formData.get('project_id') as string

    if (!materialId || quantity <= 0) {
        return { success: false, error: 'Invalid input' }
    }

    try {
        // 1. Record transaction
        const { error: txError } = await supabase
            .from('material_transactions')
            .insert({
                material_id: materialId,
                transaction_type: 'IN',
                quantity: quantity,
                notes: notes,
                project_id: projectId || null
            })

        if (txError) throw txError

        // 2. Update material stock
        const { data: mat, error: fetchError } = await supabase.from('materials').select('current_stock').eq('id', materialId).single()
        if (fetchError) throw fetchError

        const newStock = (mat.current_stock || 0) + quantity

        const { error: updateError } = await supabase
            .from('materials')
            .update({ current_stock: newStock })
            .eq('id', materialId)

        if (updateError) throw updateError

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteAllMaterials() {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('materials')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using neq random UUID is a trick to match all if no where clause needed, but explicit delete with empty filter works too usually. Safest is delete().neq or similar)
            // Actually delete() requires a filter in Supabase client usually to prevent accidental deletes.
            // Let's use greater than timestamp 0 or similar simple true condition.
            .gt('created_at', '1970-01-01')

        if (error) throw error

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function useMaterial(formData: FormData) {
    const supabase = await createClient()

    const materialId = formData.get('material_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const notes = formData.get('notes') as string
    const projectId = formData.get('project_id') as string

    if (!materialId || quantity <= 0) {
        return { success: false, error: 'Invalid input' }
    }

    try {
        // Check current stock
        const { data: mat, error: fetchError } = await supabase.from('materials').select('current_stock').eq('id', materialId).single()
        if (fetchError) throw fetchError

        if ((mat.current_stock || 0) < quantity) {
            return { success: false, error: 'Insufficient stock' }
        }

        // 1. Record transaction
        const { error: txError } = await supabase
            .from('material_transactions')
            .insert({
                material_id: materialId,
                transaction_type: 'OUT',
                quantity: quantity,
                notes: notes,
                project_id: projectId || null
            })

        if (txError) throw txError

        // 2. Update material stock
        const newStock = (mat.current_stock || 0) - quantity

        const { error: updateError } = await supabase
            .from('materials')
            .update({ current_stock: newStock })
            .eq('id', materialId)

        if (updateError) throw updateError

        if (projectId) {
            await syncPowProgressWithMaterials(projectId)
        }

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function bulkCreateMaterials(materials: {
    name: string;
    description?: string;
    unit?: string;
    initial_stock: number; // This acts as 'STOCK' or 'KEBUTUHAN' based on type
    quantity_in?: number;  // New: explicitly for 'MASUK'
    project_id?: string;
    import_type?: 'STOCK' | 'REQUIREMENT' | 'BOTH';
    distribution_name?: string
}[]) {
    const supabase = await createClient()

    try {
        const results = []
        const errors = []

        for (const m of materials) {
            // 1. Upsert material
            const { data: mat, error: matError } = await supabase
                .from('materials')
                .upsert({
                    name: m.name,
                    description: m.description,
                    unit: m.unit || 'pcs', // Default to pcs if missing
                }, { onConflict: 'name' })
                .select()
                .single()

            if (matError) {
                errors.push({ name: m.name, error: `Upsert Failed: ${matError.message}` })
                continue
            }

            // 2. Handle Stock, Requirements or Both
            const importType = m.import_type || 'STOCK'
            const rawDistName = m.distribution_name || ''
            const distName = rawDistName.trim().toUpperCase()

            // --- HANDLE REQUIREMENT ---
            if (importType === 'REQUIREMENT' || importType === 'BOTH') {
                const reqQty = Number(m.initial_stock)
                if (m.project_id && !isNaN(reqQty)) {
                    const { error: reqError } = await supabase
                        .from('project_material_requirements')
                        .upsert({
                            project_id: m.project_id,
                            material_id: mat.id,
                            quantity_needed: reqQty,
                            distribution_name: distName,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'project_id,material_id,distribution_name' })

                    if (reqError) {
                        console.error('Req Error:', reqError)
                        errors.push({ name: m.name, error: `Kebutuhan Failed: ${reqError.message}` })
                    }
                }
            }

            // --- HANDLE STOCK (MASUK) ---
            if (importType === 'STOCK' || importType === 'BOTH') {
                const stockQty = Number(importType === 'BOTH' ? (m.quantity_in || 0) : m.initial_stock);

                if (!isNaN(stockQty) && stockQty > 0) {
                    // Update global material current_stock
                    const { data: current } = await supabase.from('materials').select('current_stock').eq('id', mat.id).single()
                    await supabase.from('materials').update({
                        current_stock: (current?.current_stock || 0) + stockQty
                    }).eq('id', mat.id)

                    // Then insert transaction
                    const { error: txError } = await supabase.from('material_transactions').insert({
                        material_id: mat.id,
                        transaction_type: 'IN',
                        quantity: stockQty,
                        notes: 'Bulk Import / Input',
                        project_id: m.project_id || null,
                        distribution_name: distName
                    })

                    if (txError) {
                        console.error('Tx Error:', txError)
                        errors.push({ name: m.name, error: `Masuk Failed: ${txError.message}` })
                    }
                }
            }
            results.push(mat)
        }

        revalidatePath('/dashboard/materials')

        // Trigger PoW Sync for all involved projects
        const projectIds = Array.from(new Set(materials.map(m => m.project_id).filter(id => !!id))) as string[]
        for (const pid of projectIds) {
            await syncPowProgressWithMaterials(pid)
        }

        return {
            success: errors.length === 0,
            count: results.length,
            errors: errors.length > 0 ? errors : undefined
        }
    } catch (e: any) {
        return { success: false, error: `System Error: ${e.message}` }
    }
}

export async function getProjectMaterials(projectId: string) {
    const supabase = await createClient()

    const { data: transactions, error } = await supabase
        .from('material_transactions')
        .select(`
            quantity,
            materials (
                id,
                name,
                unit
            )
        `)
        .eq('project_id', projectId)
        .eq('transaction_type', 'OUT')

    if (error) {
        console.error('Error getting project materials:', error)
        return []
    }

    const usageMap = new Map<string, { id: string, name: string, unit: string, total: number }>()

    transactions.forEach((t: any) => {
        const mat = t.materials
        // @ts-ignore
        if (!mat) return

        // @ts-ignore
        if (!usageMap.has(mat.id)) {
            // @ts-ignore
            usageMap.set(mat.id, {
                // @ts-ignore
                id: mat.id,
                // @ts-ignore
                name: mat.name,
                // @ts-ignore
                unit: mat.unit,
                total: 0
            })
        }

        // @ts-ignore
        const current = usageMap.get(mat.id)!
        current.total += t.quantity
    })

    return Array.from(usageMap.values())
}

export async function getProjectMaterialSummary(projectId: string, distributionName?: string) {
    const supabase = await createClient()

    // 1. Get Transactions
    let txQuery = supabase
        .from('material_transactions')
        .select(`
            transaction_type,
            quantity,
            distribution_name,
            materials (
                id,
                name,
                unit
            )
        `)
        .eq('project_id', projectId)

    if (distributionName) {
        txQuery = txQuery.eq('distribution_name', distributionName)
    }

    const { data: transactions, error: txError } = await txQuery

    if (txError) {
        console.error('Error getting project material transactions:', txError)
        return []
    }

    // 2. Get Requirements
    let reqQuery = supabase
        .from('project_material_requirements')
        .select(`
            material_id,
            quantity_needed,
            distribution_name,
            materials (
                id,
                name,
                unit
            )
        `)
        .eq('project_id', projectId)

    if (distributionName) {
        reqQuery = reqQuery.eq('distribution_name', distributionName)
    }

    const { data: requirements, error: reqError } = await reqQuery

    if (reqError) {
        console.error('Error getting project requirements:', reqError)
    }

    const summaryMap = new Map<string, { id: string, name: string, unit: string, total_in: number, total_out: number, quantity_needed: number }>()

    // Process Transactions
    if (transactions) {
        transactions.forEach((t: any) => {
            const mat = t.materials
            // @ts-ignore
            if (!mat) return

            // @ts-ignore
            if (!summaryMap.has(mat.id)) {
                // @ts-ignore
                summaryMap.set(mat.id, {
                    // @ts-ignore
                    id: mat.id,
                    // @ts-ignore
                    name: mat.name,
                    // @ts-ignore
                    unit: mat.unit,
                    total_in: 0,
                    total_out: 0,
                    quantity_needed: 0
                })
            }

            // @ts-ignore
            const current = summaryMap.get(mat.id)!

            if (t.transaction_type === 'IN') {
                current.total_in += t.quantity
            } else if (t.transaction_type === 'OUT') {
                current.total_out += t.quantity
            }
        })
    }

    // Process Requirements
    if (requirements) {
        requirements.forEach((req: any) => {
            const materialId = req.material_id
            const mat = req.materials
            if (!mat) return

            if (summaryMap.has(materialId)) {
                const current = summaryMap.get(materialId)!
                current.quantity_needed = (current.quantity_needed || 0) + req.quantity_needed
            } else {
                summaryMap.set(materialId, {
                    id: materialId,
                    name: mat.name,
                    unit: mat.unit,
                    total_in: 0,
                    total_out: 0,
                    quantity_needed: req.quantity_needed
                })
            }
        })
    }

    // --- FALLBACK: If no requirements, derive from Structures & Routes ---
    if (summaryMap.size === 0) {
        const { data: structures } = await supabase
            .from('structures')
            .select('name, type')
            .eq('project_id', projectId)

        const { data: routes } = await supabase
            .from('routes')
            .select('name, type, path')
            .eq('project_id', projectId)

        // Count Poles
        const poleCount = structures?.filter(s => s.type === 'POLE' || s.name?.toUpperCase().includes('TIANG')).length || 0
        if (poleCount > 0) {
            summaryMap.set('virtual-pole', {
                id: 'virtual-pole',
                name: 'TIANG (POLE)',
                unit: 'BATANG',
                total_in: 0,
                total_out: 0,
                quantity_needed: poleCount
            })
        }

        // Count ODP/FAT
        const odpCount = structures?.filter(s => s.type === 'ODP' || s.name?.toUpperCase().includes('FAT') || s.name?.toUpperCase().includes('ODP')).length || 0
        if (odpCount > 0) {
            summaryMap.set('virtual-odp', {
                id: 'virtual-odp',
                name: 'ODP / FAT',
                unit: 'UNIT',
                total_in: 0,
                total_out: 0,
                quantity_needed: odpCount
            })
        }

        // Calculate Cable Length (exclude HDPE)
        let totalCableLength = 0
        if (routes) {
            routes.forEach((route: any) => {
                if (route.type === 'HDPE' || route.name?.toUpperCase().includes('HDPE')) return

                if (Array.isArray(route.path) && route.path.length > 1) {
                    for (let i = 0; i < route.path.length - 1; i++) {
                        const p1 = route.path[i]
                        const p2 = route.path[i + 1]
                        if (p1.lat && p1.lon && p2.lat && p2.lon) {
                            // Simple distance calculation (reusing logic from get-project-details)
                            const R = 6371
                            const dLat = (p2.lat - p1.lat) * Math.PI / 180
                            const dLon = (p2.lon - p1.lon) * Math.PI / 180
                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                            totalCableLength += (R * c * 1000) // Meters
                        }
                    }
                }
            })
        }

        if (totalCableLength > 0) {
            summaryMap.set('virtual-cable', {
                id: 'virtual-cable',
                name: 'KABEL FO (ADSS/DC)',
                unit: 'METER',
                total_in: 0,
                total_out: 0,
                quantity_needed: Math.round(totalCableLength)
            })
        }
    }

    return Array.from(summaryMap.values())
}

export async function updateMaterialRequirement(projectId: string, materialId: string, quantity: number, distributionName?: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('project_material_requirements')
            .upsert({
                project_id: projectId,
                material_id: materialId,
                quantity_needed: quantity,
                distribution_name: distributionName || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'project_id,material_id,distribution_name' })

        if (error) throw error

        revalidatePath(`/dashboard/projects/${projectId}`)
        revalidatePath('/dashboard/materials')

        // Trigger PoW Sync
        await syncPowProgressWithMaterials(projectId)

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getAvailableDistributions(projectId: string) {
    const supabase = await createClient()

    try {
        // Get from requirements
        const { data: reqDists } = await supabase
            .from('project_material_requirements')
            .select('distribution_name')
            .eq('project_id', projectId)
            .neq('distribution_name', '')

        // Get from transactions
        const { data: txDists } = await supabase
            .from('material_transactions')
            .select('distribution_name')
            .eq('project_id', projectId)
            .neq('distribution_name', '')

        const dists = new Set<string>()
        reqDists?.forEach(d => d.distribution_name && dists.add(d.distribution_name))
        txDists?.forEach(d => d.distribution_name && dists.add(d.distribution_name))

        return Array.from(dists).sort()
    } catch (e) {
        console.error('Error getting distributions:', e)
        return []
    }
}
