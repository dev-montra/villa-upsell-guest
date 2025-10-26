import React, { useState } from 'react'
import { X, ShoppingCart, Star, User, Calendar, Users, FileText, Plus, Minus } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type { Upsell, Property } from '../types'
import { formatCurrency } from '../lib/utils'

interface UpsellModalProps {
  upsell: Upsell | null
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onBook: (upsellId: number, bookingData: BookingData) => void
}

interface BookingData {
  selectedDate: Date | null
  guestCount: number
  menuOptions: string
  specialNotes: string
  totalPrice: number
  basePrice: number
}

export const UpsellModal: React.FC<UpsellModalProps> = ({
  upsell,
  property,
  isOpen,
  onClose,
  onBook,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [menuOptions, setMenuOptions] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')

  if (!isOpen || !upsell || !property) return null

  const handleBook = () => {
    const bookingData: BookingData = {
      selectedDate,
      guestCount,
      menuOptions,
      specialNotes,
      totalPrice,
      basePrice: upsell?.price || 0,
    }
    onBook(upsell.id, bookingData)
  }

  const incrementGuests = () => {
    setGuestCount(prev => Math.min(prev + 1, 20))
  }

  const decrementGuests = () => {
    setGuestCount(prev => Math.max(prev - 1, 1))
  }

  // Calculate dynamic pricing based on guest count
  const calculatePrice = () => {
    if (!upsell) return 0
    
    // Base price for 1 guest
    const basePrice = upsell.price
    
    return basePrice * guestCount
  }

  const totalPrice = calculatePrice()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/2">
              {upsell.image_url ? (
                <img
                  src={upsell.image_url}
                  alt={upsell.title}
                  className="w-full h-64 lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 lg:h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  <div className="text-center text-blue-600">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">{upsell.category}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="lg:w-1/2 p-6 max-h-screen overflow-y-auto">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {upsell.category}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                    <span>Premium</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {upsell.title}
                </h2>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalPrice, property.currency)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Total for {guestCount} {guestCount === 1 ? 'guest' : 'guests'}</p>
                    {guestCount > 1 && (
                      <p className="text-blue-600 font-medium">
                        {formatCurrency(upsell.price, property.currency)} × {guestCount}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {upsell.description}
                </p>
              </div>

              {/* Vendor Information */}
              {upsell.primary_vendor && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {upsell.primary_vendor.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {upsell.primary_vendor.service_type}
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* Booking Form */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Booking Details</h3>
                
                <div className="space-y-3">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Date & Time
                    </label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      timeCaption="Time"
                      dateFormat="MMM d, h:mm aa"
                      minDate={new Date()}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholderText="Select date & time"
                    />
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Users className="h-3 w-3 inline mr-1" />
                      Guests
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={decrementGuests}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 py-1 border border-gray-300 rounded bg-gray-50 min-w-[40px] text-center text-sm font-medium">
                        {guestCount}
                      </span>
                      <button
                        type="button"
                        onClick={incrementGuests}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {guestCount > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="text-blue-600 font-medium">
                          Price increases with guest count
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Menu Options */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Preferences
                    </label>
                    <textarea
                      value={menuOptions}
                      onChange={(e) => setMenuOptions(e.target.value)}
                      placeholder="Dietary requirements, menu preferences..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Special Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Notes
                    </label>
                    <textarea
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Special instructions..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              {/* Booking Button */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={handleBook}
                  disabled={!selectedDate}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                    selectedDate
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 inline" />
                  {selectedDate ? 'Add to Cart' : 'Select Date to Continue'}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Secure booking • Instant confirmation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}