import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react'
import { api } from '../lib/api'
import type { Upsell, OrderFormData } from '../types'
import { formatCurrency, isValidEmail, isValidPhone } from '../lib/utils'
import toast from 'react-hot-toast'

export const OrderForm: React.FC = () => {
  const { accessToken, upsellId } = useParams<{ accessToken: string; upsellId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Query to get upsell details
  const { data: upsell, isLoading } = useQuery<Upsell>(
    ['upsell', upsellId],
    () => api.get(`/upsells/${upsellId}`).then(res => res.data.upsell),
    {
      enabled: !!upsellId,
    }
  )

  // Mutation to create order
  const createOrderMutation = useMutation(
    (data: OrderFormData) => api.post('/orders', {
      ...data,
      property_id: upsell?.property_id,
      upsell_id: upsell?.id,
      vendor_id: upsell?.primary_vendor_id,
    }),
    {
      onSuccess: (response) => {
        toast.success('Service booked successfully!')
        queryClient.invalidateQueries(['upsells', accessToken])
        navigate(`/confirmation/${accessToken}/${response.data.order.id}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to book service')
      },
    }
  )

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      await createOrderMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate(`/guest/${accessToken}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!upsell) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
          <p className="text-gray-600 mb-4">The requested service is not available.</p>
          <button onClick={handleBack} className="btn-primary">
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
              onClick={handleBack}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Book Service</h1>
              <p className="text-sm text-gray-500">Complete your booking details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Details */}
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
                
                {upsell.image_url && (
                  <img
                    src={upsell.image_url}
                    alt={upsell.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{upsell.title}</h3>
                <p className="text-gray-600 mb-4">{upsell.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(upsell.price, upsell.property?.currency || 'USD')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Category</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {upsell.category}
                    </span>
                  </div>
                  
                  {upsell.primary_vendor && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{upsell.primary_vendor.name}</p>
                          <p className="text-xs text-gray-500">{upsell.primary_vendor.service_type}</p>
                        </div>
                      </div>
                      {upsell.primary_vendor.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          <span>{upsell.primary_vendor.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="label">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      {...register('guest_name', { 
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      type="text"
                      className="input"
                      placeholder="Enter your full name"
                    />
                    {errors.guest_name && (
                      <p className="mt-1 text-sm text-danger-600">{errors.guest_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      {...register('guest_email', { 
                        required: 'Email is required',
                        validate: (value: string) => isValidEmail(value) || 'Please enter a valid email address'
                      })}
                      type="email"
                      className="input"
                      placeholder="Enter your email address"
                    />
                    {errors.guest_email && (
                      <p className="mt-1 text-sm text-danger-600">{errors.guest_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      {...register('guest_phone', {
                        validate: (value: string | undefined) => !value || isValidPhone(value) || 'Please enter a valid phone number'
                      })}
                      type="tel"
                      className="input"
                      placeholder="Enter your phone number"
                    />
                    {errors.guest_phone && (
                      <p className="mt-1 text-sm text-danger-600">{errors.guest_phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Preferred Date
                    </label>
                    <input
                      {...register('scheduled_date')}
                      type="date"
                      className="input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Special Requests
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="input"
                      placeholder="Any special requests or notes..."
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary btn-lg w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          <Clock className="h-5 w-5 mr-2" />
                          Book Service
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Booking Summary */}
              <div className="card p-6 bg-primary-50">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{upsell.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium text-primary-600">
                      {formatCurrency(upsell.price, upsell.property?.currency || 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-success-600">Pending Confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}