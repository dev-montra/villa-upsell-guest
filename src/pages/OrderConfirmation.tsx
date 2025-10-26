import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { CheckCircle, ArrowLeft, Calendar, Clock, User, Mail, Phone } from 'lucide-react'
import { api } from '../lib/api'
import type { Order } from '../types'
import { formatCurrency, formatDateTime } from '../lib/utils'

export const OrderConfirmation: React.FC = () => {
  const { accessToken, orderId } = useParams<{ accessToken: string; orderId: string }>()
  const navigate = useNavigate()

  // Query to get order details
  const { data: order, isLoading } = useQuery<Order>(
    ['order', orderId],
    () => api.get(`/orders/${orderId}`).then(res => res.data.order),
    {
      enabled: !!orderId,
    }
  )

  const handleBackToServices = () => {
    navigate(`/guest/${accessToken}`)
  }

  const handleNewBooking = () => {
    navigate(`/guest/${accessToken}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The requested order could not be found.</p>
          <button onClick={handleBackToServices} className="btn-primary">
            Go Back
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
          <div className="flex items-center">
            <button
              onClick={handleBackToServices}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Booking Confirmed</h1>
              <p className="text-sm text-gray-500">Your service has been booked successfully</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">
              Your service request has been submitted and is pending confirmation from the vendor.
            </p>
          </div>

          {/* Order Details */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Order ID</span>
                <span className="font-mono text-sm font-medium">#{order.id}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Service</span>
                <span className="font-medium">{order.upsell?.title}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Property</span>
                <span className="font-medium">{order.property?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(order.total_amount, order.property?.currency || 'USD')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Booked On</span>
                <span className="font-medium">{formatDateTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-500">Name:</span>
                <span className="ml-2 font-medium">{order.guest_name}</span>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-500">Email:</span>
                <span className="ml-2 font-medium">{order.guest_email}</span>
              </div>
              
              {order.guest_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="ml-2 font-medium">{order.guest_phone}</span>
                </div>
              )}
              
              {order.scheduled_date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">Preferred Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(order.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Information */}
          {order.vendor && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-500">Vendor:</span>
                  <span className="ml-2 font-medium">{order.vendor.name}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Service Type:</span>
                  <span className="ml-2 font-medium">{order.vendor.service_type}</span>
                </div>
                
                {order.vendor.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="ml-2 font-medium">{order.vendor.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Requests</h3>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Next Steps */}
          <div className="card p-6 bg-primary-50 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <Clock className="h-4 w-4 text-primary-600 mr-3 mt-0.5" />
                <span>Your booking is pending confirmation from the service provider.</span>
              </div>
              <div className="flex items-start">
                <Mail className="h-4 w-4 text-primary-600 mr-3 mt-0.5" />
                <span>You will receive an email confirmation once the vendor confirms your booking.</span>
              </div>
              <div className="flex items-start">
                <Phone className="h-4 w-4 text-primary-600 mr-3 mt-0.5" />
                <span>The service provider may contact you directly to coordinate the service.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleNewBooking}
              className="btn-primary flex-1"
            >
              Book Another Service
            </button>
            <button
              onClick={handleBackToServices}
              className="btn-secondary flex-1"
            >
              Back to Services
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}