import React from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">LCC Assemble - Test Page</h1>
          <p className="text-lg text-gray-600 mb-6">
            If you can see this, React is working correctly!
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
            >
              Go to Login
            </Button>

            <Button
              onClick={() => window.location.href = '/register'}
              variant="outline"
              className="ml-4"
            >
              Go to Registration
            </Button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h3>
            <p className="text-xs text-gray-600">
              URL: {window.location.href}<br/>
              Time: {new Date().toLocaleString()}<br/>
              User Agent: {navigator.userAgent.substring(0, 50)}...
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default TestPage