import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { Event, BringListItem } from '../../types'

interface BringListManagerProps {
  event: Event
  currentUserId: string
  onClaimItem: (itemId: string) => Promise<void>
  onUnclaimItem: (itemId: string) => Promise<void>
  onAddItem?: (item: Omit<BringListItem, 'id'>) => Promise<void>
  canManageItems?: boolean
}

export const BringListManager: React.FC<BringListManagerProps> = ({
  event,
  currentUserId,
  onClaimItem,
  onUnclaimItem,
  onAddItem,
  canManageItems = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleClaimItem = async (itemId: string) => {
    try {
      setIsSubmitting(itemId)
      setError(null)
      await onClaimItem(itemId)
    } catch (err) {
      console.error('Error claiming item:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim item')
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleUnclaimItem = async (itemId: string) => {
    try {
      setIsSubmitting(itemId)
      setError(null)
      await onUnclaimItem(itemId)
    } catch (err) {
      console.error('Error unclaiming item:', err)
      setError(err instanceof Error ? err.message : 'Failed to unclaim item')
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.trim() || !onAddItem) return

    try {
      setIsSubmitting('add')
      setError(null)
      await onAddItem({
        item: newItem.trim(),
        quantity: newQuantity,
        fulfilled: false
      })
      setNewItem('')
      setNewQuantity(1)
      setShowAddForm(false)
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setIsSubmitting(null)
    }
  }

  const getItemStatus = (item: BringListItem) => {
    if (item.fulfilled) return 'fulfilled'
    if (item.assignedTo) return 'claimed'
    return 'available'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-100 text-green-800 border-green-200'
      case 'claimed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'available': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return '✅'
      case 'claimed': return '👤'
      case 'available': return '➕'
      default: return '📦'
    }
  }

  const claimedByCurrentUser = (item: BringListItem) => item.assignedTo === currentUserId

  if (!event.bringList.enabled) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>Bring list is not enabled for this event.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bring List</h3>
          <p className="text-sm text-gray-600">
            Help make this event special by bringing an item
          </p>
        </div>
        {canManageItems && onAddItem && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            size="sm"
          >
            {showAddForm ? 'Cancel' : 'Add Item'}
          </Button>
        )}
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}

      {/* Add Item Form */}
      {showAddForm && canManageItems && onAddItem && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Add New Item</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="Item Name"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="e.g., Salad, Dessert, Drinks"
                disabled={isSubmitting === 'add'}
              />
              <Input
                type="number"
                label="Quantity Needed"
                value={newQuantity.toString()}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                min="1"
                disabled={isSubmitting === 'add'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddItem}
                disabled={!newItem.trim() || isSubmitting === 'add'}
                isLoading={isSubmitting === 'add'}
              >
                Add Item
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting === 'add'}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {event.bringList.items.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">No items needed yet</p>
              <p className="text-sm">
                {canManageItems ? 'Add items that guests can bring to the event.' : 'Check back later for items to bring.'}
              </p>
            </div>
          </Card>
        ) : (
          event.bringList.items.map((item) => {
            const status = getItemStatus(item)
            const isClaimedByUser = claimedByCurrentUser(item)

            return (
              <Card key={item.id} className={`p-4 border-2 ${getStatusColor(status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.item}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity needed: {item.quantity}
                      </p>
                      {item.assignedTo && (
                        <p className="text-sm text-gray-600">
                          {isClaimedByUser ? 'You are bringing this' : 'Someone is bringing this'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {status === 'fulfilled' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Completed
                      </span>
                    )}

                    {status === 'claimed' && isClaimedByUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnclaimItem(item.id)}
                        disabled={isSubmitting === item.id}
                        isLoading={isSubmitting === item.id}
                      >
                        Unclaim
                      </Button>
                    )}

                    {status === 'available' && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimItem(item.id)}
                        disabled={isSubmitting === item.id}
                        isLoading={isSubmitting === item.id}
                      >
                        I'll Bring It
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {event.bringList.items.filter(item => item.fulfilled).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {event.bringList.items.filter(item => item.assignedTo).length}
            </div>
            <div className="text-sm text-gray-600">Claimed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {event.bringList.items.filter(item => !item.assignedTo && !item.fulfilled).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>
      </Card>
    </div>
  )
}