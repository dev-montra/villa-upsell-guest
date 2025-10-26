import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  Phone, 
  User
} from 'lucide-react'
import { api } from '../lib/api'
import type { Property, Upsell } from '../types'
import { formatCurrency } from '../lib/utils'
import { UpsellModal } from '../components/UpsellModal'
import { StickyCart } from '../components/StickyCart'

export const GuestDashboard: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>()
  const navigate = useNavigate()
  const [selectedUpsell, setSelectedUpsell] = useState<Upsell | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Cart item interface
interface CartItem {
    upsell: Upsell
    guestCount: number
    selectedDate: Date | null
    menuOptions: string
    specialNotes: string
    totalPrice: number
  }

  // Load cart items from sessionStorage on component mount
  useEffect(() => {
    const savedCartItems = sessionStorage.getItem('cartItems')
    if (savedCartItems) {
      try {
        const parsedItems = JSON.parse(savedCartItems)
        // Convert date strings back to Date objects
        const itemsWithDates = parsedItems.map((item: any) => ({
          ...item,
          selectedDate: item.selectedDate ? new Date(item.selectedDate) : null,
        }))
        setCartItems(itemsWithDates)
      } catch (error) {
        sessionStorage.removeItem('cartItems')
      }
    }
  }, [])

  // Query to get property and upsells
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>(
    ['property', accessToken],
    () => api.get(`/properties/access/${accessToken}`).then(res => res.data.property),
    {
      enabled: !!accessToken,
      retry: false,
    }
  )

  const { data: upsells } = useQuery<Upsell[]>(
    ['upsells', accessToken],
    () => api.get(`/properties/${property?.id}/upsells`).then(res => res.data.upsells),
    {
      enabled: !!property?.id,
      retry: false,
    }
  )

  // Use all upsells since category filter was removed
  const filteredUpsells = upsells || []

  const handleBookService = (upsellId: number) => {
    navigate(`/order/${accessToken}/${upsellId}`)
  }

  const handleUpsellClick = (upsell: Upsell) => {
    setSelectedUpsell(upsell)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUpsell(null)
  }

  const handleBookFromModal = (upsellId: number, bookingData: any) => {
    setIsModalOpen(false)
    setSelectedUpsell(null)
    
    // Add item to cart instead of navigating directly
    const upsell = upsells?.find(u => u.id === upsellId)
    if (upsell) {
      const cartItem: CartItem = {
        upsell,
        guestCount: bookingData.guestCount,
        selectedDate: bookingData.selectedDate,
        menuOptions: bookingData.menuOptions,
        specialNotes: bookingData.specialNotes,
        totalPrice: bookingData.totalPrice,
      }
      
      const updatedCartItems = [...cartItems, cartItem]
      setCartItems(updatedCartItems)
      // Persist to sessionStorage
      sessionStorage.setItem('cartItems', JSON.stringify(updatedCartItems))
    }
  }

  const handleRemoveFromCart = (upsellId: number) => {
    const updatedCartItems = cartItems.filter(item => item.upsell.id !== upsellId)
    setCartItems(updatedCartItems)
    // Persist to sessionStorage
    sessionStorage.setItem('cartItems', JSON.stringify(updatedCartItems))
  }

  const handleUpdateCartQuantity = (upsellId: number, newQuantity: number) => {
    const updatedCartItems = cartItems.map(item => {
      if (item.upsell.id === upsellId) {
        const newTotalPrice = item.upsell.price * newQuantity
        return {
          ...item,
          guestCount: newQuantity,
          totalPrice: newTotalPrice,
        }
      }
      return item
    })
    setCartItems(updatedCartItems)
    // Persist to sessionStorage
    sessionStorage.setItem('cartItems', JSON.stringify(updatedCartItems))
  }

  const handleProceedToCheckout = () => {
    // Store cart items in sessionStorage for checkout
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems))
    navigate(`/checkout/${accessToken}`)
  }

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">The access code is invalid or expired.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section with Property Image */}
      <div className="relative">
        {property.hero_image_url ? (
          <div className="h-64 md:h-50 bg-gray-200">
            <img
              src={property.hero_image_url}
              alt={property.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.name}</h1>
                <p className="text-lg md:text-xl opacity-90">Welcome to your villa experience</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.name}</h1>
              <p className="text-lg md:text-xl opacity-90">Welcome to your villa experience</p>
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <button
          onClick={() => navigate(`/checkin/${accessToken}`)}
          className="absolute top-4 left-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Services Section */}
        <div className="mb-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enhance Your Stay</h3>
            <p className="text-gray-600">Discover premium services to make your villa experience unforgettable</p>
          </div>
          
          {/* Services Grid */}
          {filteredUpsells.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredUpsells.map((upsell) => (
                <div 
                  key={upsell.id} 
                  className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  onClick={() => handleUpsellClick(upsell)}
                >
                  {upsell.image_url ? (
                    <img
                      src={upsell.image_url}
                      alt={upsell.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                      <div className="text-center text-blue-600">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3" />
                        <p className="text-sm font-medium">{upsell.category}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Overlay with Details */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-300 flex items-end">
                    <div className="w-full p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      {/* Title */}
                      <h4 className="text-white font-bold text-lg mb-3 line-clamp-2">
                        {upsell.title}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-white text-sm mb-4 line-clamp-3 opacity-90">
                        {upsell.description}
                      </p>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white font-bold text-2xl">
                          {formatCurrency(upsell.price, property.currency)}
                        </span>
                        <div className="flex items-center text-white text-sm">
                          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                          <span>Premium</span>
                        </div>
                      </div>
                      
                      {/* Vendor Info */}
                      {upsell.primary_vendor && (
                        <div className="mb-4 p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-white mr-2" />
                            <p className="text-white text-sm font-medium">{upsell.primary_vendor.name}</p>
                          </div>
                          <p className="text-white text-xs opacity-80 mb-1">{upsell.primary_vendor.service_type}</p>
                          {upsell.primary_vendor.phone && (
                            <div className="flex items-center text-white text-xs opacity-80">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{upsell.primary_vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Book Button */}
                      <button 
                        className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookService(upsell.id)
                        }}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2 inline" />
                        Book This Service
                      </button>
                    </div>
                  </div>
                  
                  {/* Category Label (Always Visible) */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black bg-opacity-60 text-white backdrop-blur-sm">
                      {upsell.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Services Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No services are currently available for this property. Check back later for exciting offers!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upsell Modal */}
      <UpsellModal
        upsell={selectedUpsell}
        property={property}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onBook={handleBookFromModal}
      />

      {/* Sticky Cart */}
      <StickyCart
        items={cartItems}
        isVisible={cartItems.length > 0}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onProceedToCheckout={handleProceedToCheckout}
        propertyCurrency={property.currency}
      />
    </div>
  )
}