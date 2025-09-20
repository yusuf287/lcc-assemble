import React from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to LCC Assemble</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start">
              📅 Create Event
            </Button>
            <Button variant="outline" className="w-full justify-start">
              👥 Browse Members
            </Button>
            <Button variant="outline" className="w-full justify-start">
              🔔 View Notifications
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <p className="text-gray-600">No upcoming events</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <p className="text-gray-600">No recent activity</p>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage