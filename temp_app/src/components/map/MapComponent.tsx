
'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix for default Leaflet icons in Next.js
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png'
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'

const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
    })
}

interface MapProps {
    center?: [number, number]
    zoom?: number
    markers?: Array<{
        id: string
        position: [number, number]
        name: string
        type: string
    }>
    routes?: Array<{
        id: string
        positions: [number, number][]
        name: string
        type: string
    }>
}

export default function MapComponent({
    center = [-8.276165, 113.536510], // Default to Jember approx based on KML
    zoom = 13,
    markers = [],
    routes = []
}: MapProps) {
    useEffect(() => {
        fixLeafletIcon()
    }, [])

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-bold">{marker.name}</p>
                            <p className="text-gray-500">{marker.type}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {routes.map((route) => (
                <Polyline
                    key={route.id}
                    positions={route.positions}
                    color={route.type === 'HDPE' ? 'blue' : 'red'}
                    weight={3}
                >
                    <Popup>
                        <div className="text-sm">
                            <p className="font-bold">{route.name}</p>
                            <p className="text-gray-500">{route.type}</p>
                        </div>
                    </Popup>
                </Polyline>
            ))}
        </MapContainer>
    )
}
