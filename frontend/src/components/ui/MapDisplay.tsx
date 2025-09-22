import React from 'react'

interface MapDisplayProps {
  address: string
  locationName?: string
  coordinates?: {
    lat: number
    lng: number
  }
  height?: string
  className?: string
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  address,
  locationName,
  coordinates,
  height = '200px',
  className = ''
}) => {
  const handleMapClick = () => {
    // Open the location in OpenStreetMap
    const lat = coordinates?.lat || 43.6532
    const lng = coordinates?.lng || -79.3832
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`, '_blank')
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <div className="relative w-full h-full bg-gray-100">
        {/* Static map background */}
        <div
          className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center cursor-pointer hover:from-green-200 hover:to-blue-200 transition-colors"
          onClick={handleMapClick}
        >
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📍</div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {locationName || 'Event Location'}
            </div>
            <div className="text-xs text-gray-600 max-w-xs">
              {address}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Click to view on OpenStreetMap
            </div>
          </div>
        </div>

        {/* Coordinates display if available */}
        {coordinates && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  )
}

export default MapDisplay