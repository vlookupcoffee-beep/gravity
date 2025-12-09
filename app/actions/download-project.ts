'use server'

import { createClient } from '@/utils/supabase/server'
import JSZip from 'jszip'

// Export BOQ as CSV
async function generateBOQCSV(projectId: string): Promise<string> {
    const supabase = await createClient()

    const { data: items } = await supabase
        .from('project_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (!items || items.length === 0) {
        return 'Item Code,Description,Unit,Unit Price,Quantity,Total Price,Progress\n'
    }

    const header = 'Item Code,Description,Unit,Unit Price,Quantity,Total Price,Progress\n'
    const rows = items.map(item => {
        const totalPrice = (item.unit_price || 0) * (item.quantity || 0)
        return [
            item.item_code || '',
            `"${(item.description || '').replace(/"/g, '""')}"`,
            item.unit || '',
            item.unit_price || 0,
            item.quantity || 0,
            totalPrice,
            `${item.progress || 0}%`
        ].join(',')
    }).join('\n')

    return header + rows
}

// Export PoW as CSV
async function generatePoWCSV(projectId: string): Promise<string> {
    const supabase = await createClient()

    const { data: tasks } = await supabase
        .from('pow_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

    if (!tasks || tasks.length === 0) {
        return 'Task Name,Description,Start Date,End Date,Duration (Days),Progress,Status,Assigned To,Estimated Cost\n'
    }

    const header = 'Task Name,Description,Start Date,End Date,Duration (Days),Progress,Status,Assigned To,Estimated Cost\n'
    const rows = tasks.map(task => {
        return [
            `"${(task.task_name || '').replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            task.start_date || '',
            task.end_date || '',
            task.duration_days || 0,
            `${task.progress || 0}%`,
            task.status || 'not-started',
            task.assigned_to || '',
            task.estimated_cost || 0
        ].join(',')
    }).join('\n')

    return header + rows
}

// Generate KML from structures and routes
async function generateKML(projectId: string, projectName: string): Promise<string> {
    const supabase = await createClient()

    const { data: structures } = await supabase
        .from('structures')
        .select('*')
        .eq('project_id', projectId)

    const { data: routes } = await supabase
        .from('routes')
        .select('*')
        .eq('project_id', projectId)

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(projectName)}</name>
    <description>Project data exported from Gravity</description>
`

    // Add Structures (Points)
    if (structures && structures.length > 0) {
        kml += '    <Folder>\n      <name>Structures</name>\n'

        for (const struct of structures) {
            const coords = struct.coordinates as any
            if (coords && coords.lat && coords.lon) {
                kml += `      <Placemark>
        <name>${escapeXml(struct.name || 'Unnamed')}</name>
        <description>Type: ${escapeXml(struct.type || 'Unknown')}</description>
        <Point>
          <coordinates>${coords.lon},${coords.lat},0</coordinates>
        </Point>
      </Placemark>
`
            }
        }

        kml += '    </Folder>\n'
    }

    // Add Routes (LineStrings)
    if (routes && routes.length > 0) {
        kml += '    <Folder>\n      <name>Routes</name>\n'

        for (const route of routes) {
            const path = route.path as any[]
            if (path && path.length > 0) {
                const coordsStr = path
                    .map(p => `${p.lon},${p.lat},0`)
                    .join(' ')

                kml += `      <Placemark>
        <name>${escapeXml(route.name || 'Unnamed')}</name>
        <description>Type: ${escapeXml(route.type || 'Unknown')}</description>
        <LineString>
          <coordinates>${coordsStr}</coordinates>
        </LineString>
      </Placemark>
`
            }
        }

        kml += '    </Folder>\n'
    }

    kml += `  </Document>
</kml>`

    return kml
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

// Main function to download project as ZIP
export async function downloadProjectArchive(projectId: string) {
    try {
        const supabase = await createClient()

        // Get project details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()

        if (projectError || !project) {
            return { success: false, error: 'Project not found' }
        }

        const projectName = project.name || 'Project'
        const zip = new JSZip()

        // Generate and add BOQ CSV
        const boqCSV = await generateBOQCSV(projectId)
        zip.file('BOQ.csv', boqCSV)

        // Generate and add PoW CSV
        const powCSV = await generatePoWCSV(projectId)
        zip.file('PoW.csv', powCSV)

        // Generate and add KML
        const kml = await generateKML(projectId, projectName)
        zip.file(`${projectName}.kml`, kml)

        // Generate ZIP as base64
        const zipBlob = await zip.generateAsync({ type: 'base64' })

        return {
            success: true,
            data: zipBlob,
            filename: `${projectName}.zip`
        }
    } catch (error: any) {
        console.error('Error generating project archive:', error)
        return { success: false, error: error.message }
    }
}
