'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadKHS(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File
    const providerName = formData.get('providerName') as string

    if (!file || !providerName) {
        return { error: 'File and Provider Name are required' }
    }

    // 1. Create or Get Provider
    const { data: provider, error: providerError } = await supabase
        .from('khs_providers')
        .insert({ name: providerName })
        .select()
        .single()

    // Handle duplicate provider (optional: or just select existing)
    let providerId = provider?.id
    if (providerError) {
        // If error is unique constraint, fetch existing (simplistic approach)
        // For now, let's assume we want to create new or fail. 
        // Better: Try selecting if insert failed.
        const { data: existing } = await supabase
            .from('khs_providers')
            .select('id')
            .eq('name', providerName)
            .single()

        if (existing) providerId = existing.id
        else return { error: 'Failed to create provider or provider already exists.' }
    }

    // 2. Read and Parse CSV
    const text = await file.text()
    const lines = text.split(/\r?\n/)

    const itemsToInsert = []
    const priceType = formData.get('priceType') as string || 'vendor'

    // Detect separator: semicollon is common in ID local Excel exports, comma is standard CSV
    const firstLine = lines[0] || ""
    const sep = firstLine.includes(';') ? ';' : ','

    let headerFound = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const cols = line.split(sep)
        if (cols.length < 4) continue

        // Skip header lines: The first column usually contains a number (NO) for data rows
        // If it's not a number and we haven't found data yet, skip it.
        const noValue = cols[0].trim()
        if (!headerFound) {
            if (isNaN(Number(noValue)) || noValue === "") {
                continue
            }
            headerFound = true
        }

        const itemCode = cols[1]?.trim()
        const description = cols[2]?.trim()
        const unit = cols[3]?.trim()
        const priceStr = cols[4]?.trim()
        const mandorPriceStr = cols[5]?.trim()

        if (!itemCode || !priceStr) continue

        // Robust Price Parsing:
        // Handle Indonesian format (e.g. 1.234,50) where '.' is thousand and ',' is decimal
        // AND handle standard format (e.g. 1,234.50)
        let normalizedPrice = priceStr.replace(/Rp/gi, '').replace(/\s/g, '').trim()

        if (normalizedPrice.includes(',') && normalizedPrice.includes('.')) {
            // Mixed separators: Assume the last one is the decimal
            if (normalizedPrice.lastIndexOf(',') > normalizedPrice.lastIndexOf('.')) {
                normalizedPrice = normalizedPrice.replace(/\./g, '').replace(',', '.')
            } else {
                normalizedPrice = normalizedPrice.replace(/,/g, '')
            }
        } else if (normalizedPrice.includes(',')) {
            // Only comma: Is it decimal (1,5) or thousand (1,000)?
            const pieces = normalizedPrice.split(',')
            if (pieces.length === 2 && pieces[1].length === 3) {
                // Highly likely a thousand separator (e.g. 1,000)
                normalizedPrice = normalizedPrice.replace(/,/g, '')
            } else {
                // Likely a decimal (e.g. 1,5 or 12,50)
                normalizedPrice = normalizedPrice.replace(',', '.')
            }
        } else {
            // Only dots or nothing: Treat dots as potential thousand separators
            // Unless it's clearly a decimal (e.g. 1.5) - but in ID KHS, dots are almost always thousands
            // Let's assume dots are thousands if they are followed by 3 digits
            const pieces = normalizedPrice.split('.')
            if (pieces.length > 1 && pieces[pieces.length - 1].length === 3) {
                normalizedPrice = normalizedPrice.replace(/\./g, '')
            }
        }

        const priceVal = parseFloat(normalizedPrice)
        if (isNaN(priceVal)) continue

        const item: any = {
            provider_id: providerId,
            item_code: itemCode,
            description: description,
            unit: unit
        }

        if (priceType === 'mandor') {
            item.price_mandor = priceVal
        } else {
            item.price = priceVal
            // Handle dual-price CSV (if mandor price is in 6th column)
            if (mandorPriceStr) {
                let mPriceNormalized = mandorPriceStr.replace(/Rp/gi, '').replace(/\s/g, '').trim()
                // ... simplistic parse for the second column for now or reuse logic ...
                const mPriceVal = parseFloat(mPriceNormalized.replace(/\./g, '').replace(',', '.'))
                if (!isNaN(mPriceVal) && mPriceVal > 0) {
                    item.price_mandor = mPriceVal
                }
            }
        }

        itemsToInsert.push(item)
    }

    if (itemsToInsert.length === 0) {
        return { error: 'No valid items found in CSV' }
    }

    // 3. Bulk Insert Items
    const { error: insertError } = await supabase
        .from('khs_items')
        .upsert(itemsToInsert, { onConflict: 'provider_id,item_code' })

    if (insertError) {
        console.error('Insert Error:', insertError)
        return { error: 'Failed to insert items into database.' }
    }

    revalidatePath('/dashboard/khs')
    return { success: true, count: itemsToInsert.length }
}

// Delete a KHS provider and ALL its items
export async function deleteAllKHSItems(providerId: string) {
    const supabase = await createClient()

    // Deleting the provider will cascade to items because of the schema constraint (ON DELETE CASCADE)
    const { error } = await supabase
        .from('khs_providers')
        .delete()
        .eq('id', providerId)

    if (error) {
        console.error('Delete Provider Error:', error)
        // Fallback: try deleting items only if provider delete failed (though it shouldn't if cascaded correctly)
        const { error: itemsError } = await supabase
            .from('khs_items')
            .delete()
            .eq('provider_id', providerId)

        if (itemsError) return { success: false, error: itemsError.message }
    }

    revalidatePath('/dashboard/khs')
    return { success: true }
}
