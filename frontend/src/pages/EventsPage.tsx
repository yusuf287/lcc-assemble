import React from 'react'
import { Card } from '../components/ui/Card'

const EventsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Discover and join community events</p>
        </div>
      </div>
      <Card className="p-8">
        <p className="text-center text-gray-600">Events page coming soon...</p>
      </Card>
    </div>
  )
}

export default EventsPage