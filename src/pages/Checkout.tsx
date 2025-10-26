import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  AlertCircle,
  Calendar,
  FileText,
  X,
  Plus,
  Minus
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../lib/api'
import type { Property, Upsell } from '../types'
import { formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'

// Debug environment variable loading
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Use the correct live Stripe key that matches the backend
const LIVE_STRIPE_KEY = 'pk_live_51RAKtQBzANOidB97Zo93RkjyKBHnxeXd1Pwbj7NznOGJlNnJQ0voTgzmigRXpb9qq5Mi2wc4XsrXgSnqNBDLMcv000IyF0HjZ7'
const finalStripeKey = stripeKey || LIVE_STRIPE_KEY

const stripePromise = loadStripe(finalStripeKey)

interface CartItem {
  upsell: Upsell
  guestCount: number
  selectedDate: Date | null
  menuOptions: string
  specialNotes: string
  totalPrice: number
}

// Stripe Elements configuration
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146',
    },
  },
  hidePostalCode: true, // Hide postal code field
}

// Payment Form Component using Stripe Elements
interface PaymentFormProps {
  accessToken: string
  cartItems: CartItem[]
  totalAmount: number
  onSuccess: () => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ accessToken, cartItems, totalAmount, onSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  // Debug Stripe initialization
  
  // Show error if Stripe is not initialized
  useEffect(() => {
    if (!stripe) {
      // Stripe not ready
    }
  }, [stripe])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const response = await api.post('/guest/payments/create-intent', {
        access_token: accessToken,
        cart_items: cartItems.map(item => ({
          upsell_id: item.upsell.id,
          guest_count: item.guestCount,
          total_price: item.totalPrice,
          selected_date: item.selectedDate?.toISOString(),
          menu_options: item.menuOptions,
          special_notes: item.specialNotes,
        })),
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment intent')
      }

      const { error } = await stripe.confirmCardPayment(response.data.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        throw new Error(error.message || 'Payment failed')
      }

      toast.success('Payment successful!')
      onSuccess()

    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Enter your card number, expiry date, and CVC in the field below
        </p>
        <div className="p-3 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}
      </button>
    </form>
  )
}

export const Checkout: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wise'>('stripe')
  const [isWiseProcessing, setIsWiseProcessing] = useState(false)

  // Load cart items from sessionStorage
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
        toast.error('Failed to load cart items')
        navigate(`/guest/${accessToken}`)
      }
    } else {
      toast.error('No items in cart')
      navigate(`/guest/${accessToken}`)
    }
  }, [accessToken, navigate])

  // Get property information
  const { data: property, isLoading: propertyLoading } = useQuery<Property>(
    ['property', accessToken],
    () => api.get(`/properties/access/${accessToken}`).then(res => res.data.property),
    {
      enabled: !!accessToken,
    }
  )

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalGuests = cartItems.reduce((sum, item) => sum + item.guestCount, 0)

  // Set default payment method based on property settings
  useEffect(() => {
    if (property) {
      setPaymentMethod(property.payment_processor)
    }
  }, [property])

  const handleRemoveItem = (upsellId: number) => {
    const updatedItems = cartItems.filter(item => item.upsell.id !== upsellId)
    setCartItems(updatedItems)
    sessionStorage.setItem('cartItems', JSON.stringify(updatedItems))
    
    if (updatedItems.length === 0) {
      navigate(`/guest/${accessToken}`)
    }
  }

  const handleUpdateQuantity = (upsellId: number, newQuantity: number) => {
    const updatedItems = cartItems.map(item => {
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
    setCartItems(updatedItems)
    sessionStorage.setItem('cartItems', JSON.stringify(updatedItems))
  }

  const handlePaymentSuccess = () => {
    navigate(`/checkout/success/${accessToken}`)
  }

  const handleWisePayment = async () => {
    if (!accessToken) return

    setIsWiseProcessing(true)
    try {
      const response = await api.post('/guest/payments/wise', {
        access_token: accessToken,
        cart_items: cartItems.map(item => ({
          upsell_id: item.upsell.id,
          guest_count: item.guestCount,
          total_price: item.totalPrice,
          selected_date: item.selectedDate?.toISOString(),
          menu_options: item.menuOptions,
          special_notes: item.specialNotes,
        })),
      })

      if (response.data.success) {
        // Handle real Wise payment response
        if (response.data.payment_url) {
          // Redirect to Wise payment page
          window.location.href = response.data.payment_url
        } else {
          // Show bank transfer instructions
          toast.success('Order created! Please complete bank transfer.')
          setTimeout(() => {
            navigate(`/checkout/success/${accessToken}`)
          }, 2000)
        }
      } else {
        throw new Error(response.data.message || 'Failed to create Wise payment')
      }

    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.')
    } finally {
      setIsWiseProcessing(false)
    }
  }


  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/guest/${accessToken}`)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-500">{property.name}</p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cart Summary */}
            <div className="lg:col-span-3">
              <div className="card p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Order Summary
                </h2>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.upsell.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={item.upsell.image_url || '/placeholder-service.jpg'}
                            alt={item.upsell.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="absolute -top-1 -right-1 bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                            {item.guestCount}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.upsell.title}</h3>
                              <p className="text-sm text-gray-600">{item.upsell.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-blue-600">
                                {formatCurrency(item.totalPrice, property.currency)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(parseFloat(item.upsell.price.toString()), property.currency)} per guest
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              {item.selectedDate && (
                                <div className="flex items-center text-gray-600">
                                  <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                                  <span>{item.selectedDate.toLocaleDateString()}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleUpdateQuantity(item.upsell.id, Math.max(1, item.guestCount - 1))}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {item.guestCount}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.upsell.id, Math.min(20, item.guestCount + 1))}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveItem(item.upsell.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center px-2 py-1 hover:bg-red-50 rounded"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </button>
                          </div>

                          {(item.menuOptions || item.specialNotes) && (
                            <div className="mt-2 space-y-1">
                              {item.menuOptions && (
                                <div className="flex items-center text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                                  <FileText className="h-3 w-3 mr-1 text-blue-500" />
                                  <span className="font-medium">Menu:</span> {item.menuOptions}
                                </div>
                              )}
                              {item.specialNotes && (
                                <div className="flex items-center text-xs text-gray-600 bg-green-50 px-2 py-1 rounded">
                                  <FileText className="h-3 w-3 mr-1 text-green-500" />
                                  <span className="font-medium">Notes:</span> {item.specialNotes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment
                </h2>

                {/* Payment Method Selection - Dynamic based on property settings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {property.payment_processor === 'stripe' && (
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="stripe"
                          checked={paymentMethod === 'stripe'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-gray-500">Secure payment via Stripe</p>
                        </div>
                      </label>
                    )}
                    {property.payment_processor === 'wise' && (
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="wise"
                          checked={paymentMethod === 'wise'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'wise')}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-gray-500">Manual bank transfer via Wise</p>
                        </div>
                      </label>
                    )}
                    {/* Show both options if property supports both (for future enhancement) */}
                    {property.payment_processor === 'stripe' && property.wise_account_details && (
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="wise"
                          checked={paymentMethod === 'wise'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'wise')}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-gray-500">Alternative payment method</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal ({cartItems.length} {cartItems.length === 1 ? 'service' : 'services'})</span>
                    <span className="font-medium">{formatCurrency(totalAmount, property.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Total Guests</span>
                    <span className="font-medium">{totalGuests}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(totalAmount, property.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wise Payment Instructions - Only show when Wise is selected */}
                {paymentMethod === 'wise' && property.wise_account_details && (
                  <div className="mb-6">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900">Bank Transfer Details</h3>
                      </div>
                      
                      <div className="bg-white rounded-lg p-5 mb-4 shadow-sm">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-semibold text-gray-700 text-sm">Bank Name</span>
                            <span className="font-mono text-gray-900 text-sm bg-gray-50 px-3 py-1 rounded">
                              {property.wise_account_details.bank_name || 'Not provided'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-semibold text-gray-700 text-sm">Account Holder</span>
                            <span className="font-mono text-gray-900 text-sm bg-gray-50 px-3 py-1 rounded">
                              {property.wise_account_details.account_holder_name || 'Not provided'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-semibold text-gray-700 text-sm">Account Number</span>
                            <span className="font-mono text-gray-900 text-sm bg-gray-50 px-3 py-1 rounded">
                              {property.wise_account_details.account_number || 'Not provided'}
                            </span>
                          </div>
                          
                          {property.wise_account_details.routing_number && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="font-semibold text-gray-700 text-sm">Routing Number</span>
                              <span className="font-mono text-gray-900 text-sm bg-gray-50 px-3 py-1 rounded">
                                {property.wise_account_details.routing_number}
                              </span>
                            </div>
                          )}
                          
                          {property.wise_account_details.swift_code && (
                            <div className="flex justify-between items-center py-2">
                              <span className="font-semibold text-gray-700 text-sm">SWIFT Code</span>
                              <span className="font-mono text-gray-900 text-sm bg-gray-50 px-3 py-1 rounded">
                                {property.wise_account_details.swift_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-amber-800 mb-1 text-sm">Important Notice</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                              After completing the bank transfer, your order will be confirmed manually by the property owner. 
                              You will receive an email confirmation once the payment is verified.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {paymentMethod === 'stripe' ? (
                  <Elements stripe={stripePromise}>
                    <PaymentForm 
                      accessToken={accessToken!}
                      cartItems={cartItems}
                      totalAmount={totalAmount}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleWisePayment}
                      disabled={isWiseProcessing || cartItems.length === 0}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                        isWiseProcessing || cartItems.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isWiseProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Create Order - {formatCurrency(totalAmount, property.currency)}
                        </>
                      )}
                    </button>
                    
                    <div className="text-center">
                      <div className="flex justify-center space-x-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Secure
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Manual Confirmation
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Order confirmed after bank transfer verification
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'stripe' && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Secure payment • Instant confirmation • Free cancellation
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}