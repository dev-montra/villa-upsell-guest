import React from 'react'
import { ShoppingCart, X, Plus, Minus, ArrowRight } from 'lucide-react'
import type { Upsell } from '../types'
import { formatCurrency } from '../lib/utils'

interface CartItem {
  upsell: Upsell
  guestCount: number
  selectedDate: Date | null
  menuOptions: string
  specialNotes: string
  totalPrice: number
}

interface StickyCartProps {
  items: CartItem[]
  isVisible: boolean
  onRemoveItem: (upsellId: number) => void
  onUpdateQuantity: (upsellId: number, quantity: number) => void
  onProceedToCheckout: () => void
  propertyCurrency: string
}

export const StickyCart: React.FC<StickyCartProps> = ({
  items,
  isVisible,
  onRemoveItem,
  onUpdateQuantity,
  onProceedToCheckout,
  propertyCurrency,
}) => {
  if (!isVisible || items.length === 0) return null

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalGuests = items.reduce((sum, item) => sum + item.guestCount, 0)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Cart Summary */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {items.length}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {items.length} {items.length === 1 ? 'service' : 'services'}
                </p>
                <p className="text-xs text-gray-500">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'} total
                </p>
              </div>
            </div>

            {/* Cart Items Preview */}
            <div className="hidden md:flex items-center space-x-2">
              {items.slice(0, 3).map((item) => (
                <div key={item.upsell.id} className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                  <img
                    src={item.upsell.image_url || '/placeholder-service.jpg'}
                    alt={item.upsell.title}
                    className="w-6 h-6 rounded object-cover"
                  />
                  <span className="text-xs text-gray-700 truncate max-w-20">
                    {item.upsell.title}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.upsell.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {items.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{items.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Total and Checkout */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(totalAmount, propertyCurrency)}
              </p>
              <p className="text-xs text-gray-500">Total amount</p>
            </div>
            
            <button
              onClick={onProceedToCheckout}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Cart Items */}
        <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.upsell.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <div className="flex items-center space-x-2 flex-1">
                  <img
                    src={item.upsell.image_url || '/placeholder-service.jpg'}
                    alt={item.upsell.title}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.upsell.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.guestCount} {item.guestCount === 1 ? 'guest' : 'guests'} • {formatCurrency(item.totalPrice, propertyCurrency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateQuantity(item.upsell.id, Math.max(1, item.guestCount - 1))}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium text-gray-900 min-w-[20px] text-center">
                      {item.guestCount}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.upsell.id, Math.min(20, item.guestCount + 1))}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.upsell.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}