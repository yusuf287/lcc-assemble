import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Event } from '../../types'
import { claimBringListItem } from '../../services/eventService'
import toast from 'react-hot-toast'

interface BringListComponentProps {
  event: Event
  onItemClaimed?: () => void
}

export const BringListComponent: React.FC<BringListComponentProps> = ({
  event,
  onItemClaimed
}) => {
  const { user } = useAuth()
  const [claimingItem, setClaimingItem] = useState<string | null>(null)

  if (!event.bringList.enabled || !event.bringList.items.length) {
    return null
  }

  const handleClaimItem = async (itemId: string) => {
    if (!user) {
      toast.error('Please log in to claim items')
      return
    }

    try {
      setClaimingItem(itemId)
      await claimBringListItem(event.id, itemId, user.uid)
      toast.success('Item claimed successfully!')
      onItemClaimed?.()
    } catch (error: any) {
      console.error('Error claiming item:', error)
      toast.error(error.message || 'Failed to claim item')
    } finally {
      setClaimingItem(null)
    }
  }

  const getItemStatus = (item: Event['bringList']['items'][0]) => {
    if (item.assignedTo) {
      if (item.assignedTo === user?.uid) {
        return { status: 'claimed-by-me', text: 'Claimed by you', color: 'bg-green-100 text-green-800' }
      } else {
        return { status: 'claimed', text: 'Claimed', color: 'bg-blue-100 text-blue-800' }
      }
    }
    return { status: 'available', text: 'Available', color: 'bg-gray-100 text-gray-800' }
  }

  const isPastEvent = new Date(event.dateTime) < new Date()
  const isUserAttending = user ? event.attendees[user.uid]?.status === 'going' : false

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">What to Bring</h3>
          <span className="text-sm text-gray-600">
            {event.bringList.items.length} item{event.bringList.items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {!isUserAttending && !isPastEvent && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              RSVP as "Going" to claim items from the bring list.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {event.bringList.items.map((item) => {
            const itemStatus = getItemStatus(item)
            const canClaim = !item.assignedTo && !isPastEvent && isUserAttending && itemStatus.status === 'available'

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{item.item}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${itemStatus.color}`}>
                      {itemStatus.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Quantity needed: {item.quantity}
                    {item.fulfilled && (
                      <span className="ml-2 text-green-600">✓ Fulfilled</span>
                    )}
                  </p>
                  {item.assignedTo && item.assignedTo !== user?.uid && (
                    <p className="text-xs text-gray-500 mt-1">
                      Someone else has claimed this item
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {canClaim && (
                    <Button
                      size="sm"
                      onClick={() => handleClaimItem(item.id)}
                      disabled={claimingItem === item.id}
                      isLoading={claimingItem === item.id}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {claimingItem === item.id ? 'Claiming...' : 'Claim'}
                    </Button>
                  )}

                  {itemStatus.status === 'claimed-by-me' && !isPastEvent && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Yours
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {event.bringList.items.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No items on the bring list yet.</p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-1">How it works:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• RSVP as "Going" to access the bring list</li>
            <li>• Claim items you can bring to the event</li>
            <li>• Mark items as fulfilled when you bring them</li>
            <li>• Help make the event successful for everyone!</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}