// @ts-nocheck
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Key, ArrowRight, Home, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import type { Property } from '../types'

export const CheckIn: React.FC = (): React.ReactElement => {
  const { accessToken } = useParams<{ accessToken: string }>()
  const navigate = useNavigate()
  const [inputToken, setInputToken] = useState(accessToken || '')
  const [isValidating, setIsValidating] = useState(false)

  // Query to validate access token and get property info
  const { data: property, isLoading, error } = useQuery<Property>(
    ['property', accessToken],
    () => api.get(`/properties/access/${accessToken}`).then(res => res.data.property),
    {
      enabled: !!accessToken,
      retry: false,
    }
  )

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputToken.trim()) return

    setIsValidating(true)
    try {
      // Navigate to the check-in form with the token
      navigate(`/checkin-form/${inputToken.trim()}`)
    } catch (error) {
      setIsValidating(false)
    }
  }

  // If we have a valid property, show welcome screen
  if (property && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Home className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {property.name}
            </h1>
            <p className="text-lg text-gray-600">
              Your personalized villa experience awaits
            </p>
          </div>

          {/* Property Info Card */}
          <div className="max-w-md mx-auto mb-8">
            <div className="card p-6 text-center">
              {property.hero_image_url && (
                <img
                  src={property.hero_image_url}
                  alt={property.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {property.name}
              </h2>
              {property.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {property.description}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {property.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => navigate(`/checkin-form/${accessToken}`)}
                className="btn-primary btn-lg w-full"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Check-in
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success-100 rounded-full mb-3">
                  <Sparkles className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Premium Services</h3>
                <p className="text-sm text-gray-600">Access exclusive upsell services</p>
              </div>
              <div className="p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
                  <Key className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Easy Booking</h3>
                <p className="text-sm text-gray-600">Book services with just a few taps</p>
              </div>
              <div className="p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                  <Home className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Personalized</h3>
                <p className="text-sm text-gray-600">Tailored to your villa experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If there's an error or no access token, show the token input form
  const content = (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Villa Check-in
          </h1>
          <p className="text-lg text-gray-600">
            Enter your access code to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-danger-800 text-sm">
              {(() => {
                const errorObj = error as any;
                return errorObj?.response?.status === 404 
                  ? 'Invalid access code. Please check the code provided by your host.'
                  : 'Unable to verify access code. Please try again.';
              })()}
            </p>
          </div>
        )}

        {/* Token Input Form */}
        <div className="card p-6">
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label className="label">Access Code</label>
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your access code"
                className="input text-center text-lg tracking-wider"
                disabled={isValidating}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!inputToken.trim() || isValidating}
              className="btn-primary btn-lg w-full"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an access code? Contact your host for assistance.
          </p>
        </div>
      </div>
    </div>
  ) as React.ReactElement
  
  return content
}