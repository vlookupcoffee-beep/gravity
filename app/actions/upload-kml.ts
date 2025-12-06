
'use server'

import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { parseStringPromise } from 'xml2js'

export async function processKmlUpload(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file provided' }
    }

    const text = await file.text()

    try {
        const result = await parseStringPromise(text)
        const kml = result.kml
        const document = kml.Document?.[0]

        if (!document) {
            return { error: 'Invalid KML: No Document found' }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Create Project (Grouping)
        const projectName = document.name?.[0] || file.name
        const { data: project, error: projError } = await supabase
            .from('projects')
            .insert({ name: projectName })
            .select()
            .single()

        if (projError) {
            console.error('Project creation failed:', projError)
            return { error: 'Failed to create project: ' + projError.message }
        }

        const placemarks: any[] = []

        // Recursive function to find Placemarks in Folders
        const findPlacemarks = (container: any) => {
            if (container.Placemark) {
                placemarks.push(...container.Placemark)
            }
            if (container.Folder) {
                container.Folder.forEach((folder: any) => findPlacemarks(folder))
            }
        }

        findPlacemarks(document)

        const structures: any[] = []
        const routes: any[] = []

        for (const placemark of placemarks) {
            const name = placemark.name?.[0] || 'Unnamed'

            // Handle Point (Structures)
            if (placemark.Point) {
                const coordsRaw = placemark.Point[0].coordinates[0].trim()
                const [lon, lat] = coordsRaw.split(',').map(Number)

                structures.push({
                    project_id: project.id,
                    name,
                    type: name.includes('MH') ? 'MH' : name.includes('HH') ? 'HH' : 'POLE', // Simple heuristic
                    coordinates: `POINT(${lon} ${lat})`,
                    metadata: { original_kml: placemark }
                })
            }

            // Handle LineString (Routes)
            if (placemark.LineString) {
                const coordsRaw = placemark.LineString[0].coordinates[0].trim()
                const points = coordsRaw.split(/\s+/).map((p: string) => {
                    const [lon, lat] = p.split(',').map(Number)
                    return `${lon} ${lat}`
                }).join(',')

                routes.push({
                    project_id: project.id,
                    name,
                    type: name.includes('HDPE') ? 'HDPE' : 'CABLE',
                    path: `LINESTRING(${points})`,
                    metadata: { original_kml: placemark }
                })
            }
        }

        // Bulk Insert - gunakan format sederhana dulu
        if (structures.length > 0) {
            // Insert satu per satu untuk debugging
            for (const struct of structures) {
                const { data, error: sError } = await supabase
                    .from('structures')
                    .insert({
                        project_id: struct.project_id,
                        name: struct.name,
                        type: struct.type,
                        coordinates: struct.coordinates, // Akan di-cast otomatis oleh Supabase
                        metadata: struct.metadata
                    })
                    .select()

                if (sError) {
                    console.error('Structure insert error:', sError)
                } else {
                    console.log('Structure inserted:', data)
                }
            }
        }

        if (routes.length > 0) {
            for (const route of routes) {
                const { data, error: rError } = await supabase
                    .from('routes')
                    .insert({
                        project_id: route.project_id,
                        name: route.name,
                        type: route.type,
                        path: route.path, // Akan di-cast otomatis oleh Supabase
                        metadata: route.metadata
                    })
                    .select()

                if (rError) {
                    console.error('Route insert error:', rError)
                } else {
                    console.log('Route inserted:', data)
                }
            }
        }

        return { success: true, counts: { structures: structures.length, routes: routes.length } }

    } catch (err: any) {
        console.error('KML processing error:', err)
        return { error: 'Failed to process KML: ' + err.message }
    }
}
