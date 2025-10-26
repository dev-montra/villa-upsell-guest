import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Upload, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { api } from '../lib/api'
import { isValidEmail, isValidPhone } from '../lib/utils'
import toast from 'react-hot-toast'

interface GuestCheckInFormData {
  fullName: string
  email: string
  phoneNumber: string
  passportFile?: File
}

export const GuestCheckInForm: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passportPreview, setPassportPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<GuestCheckInFormData>()

  // First validate the property access token
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery(
    ['property', accessToken],
    () => api.get(`/properties/access/${accessToken}`).then(res => res.data.property),
    {
      enabled: !!accessToken,
      retry: false,
      onError: () => {
        // Property validation error
      },
    }
  )

  // Check if guest has already checked in (only if property is valid)
  const { data: existingCheckIn, error: checkInError } = useQuery(
    ['guest-check-in-status', accessToken],
    () => api.get(`/guest/check-in-status/${accessToken}`).then(res => res.data.check_in),
    {
      enabled: false, // Disabled by default - we'll enable it manually when needed
      retry: false,
      onError: (error: any) => {
        // If 404, guest hasn't checked in yet - this is normal, don't log as error
        if (error.response?.status !== 404) {
          // Error checking check-in status
        }
      },
    }
  )

  // Function to check if current guest has already checked in
  const checkGuestStatus = async (email: string) => {
    try {
      const response = await api.get(`/guest/check-specific-status/${accessToken}?email=${encodeURIComponent(email)}`)
      return response.data.check_in
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null // Guest hasn't checked in yet
      }
      throw error
    }
  }

  const handlePassportUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Please upload an image or PDF file')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPassportPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPassportPreview(null)
      }
    }
  }

  const onSubmit = async (data: GuestCheckInFormData) => {
    // Prevent submission if property is invalid
    if (!property) {
      toast.error('Invalid property access token. Please try again.')
      return
    }

    setIsSubmitting(true)
    
    try {
      // First check if this specific guest has already checked in
      const existingGuestCheckIn = await checkGuestStatus(data.email)
      
      if (existingGuestCheckIn) {
        toast.success('You have already checked in! Redirecting to services...')
        setTimeout(() => {
          navigate(`/guest/${accessToken}`)
        }, 1500)
        return
      }

      // Upload passport file if provided
      let passportUrl = null
      if (selectedFile) {
        const formData = new FormData()
        formData.append('image', selectedFile)
        const uploadResponse = await api.post('/guest/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        passportUrl = uploadResponse.data.url
      }

      // Submit guest check-in data
      const checkInData = {
        access_token: accessToken,
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
        passport_url: passportUrl,
        check_in_time: new Date().toISOString(),
      }

      // Call the backend API
      await api.post('/guest/check-in', checkInData)
      
      toast.success('Check-in completed successfully!')
      
      // Navigate to guest dashboard
      navigate(`/guest/${accessToken}`)
      
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        // Guest has already checked in
        toast.success('You have already checked in! Redirecting to services...')
        setTimeout(() => {
          navigate(`/guest/${accessToken}`)
        }, 1500)
        return // Exit early to prevent further error handling
      } else if (error.response?.status === 404) {
        // Invalid access token
        toast.error('Invalid access token. Please check your access code.')
      } else if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data?.errors
        if (errors) {
          const firstError = Object.values(errors)[0]
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
        } else {
          toast.error('Please check your information and try again.')
        }
      } else {
        // Generic error
        toast.error('Failed to complete check-in. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking property
  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating property access...</p>
        </div>
      </div>
    )
  }

  // Show error state if property access token is invalid
  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Access Token</h1>
          <p className="text-gray-600 mb-4">The property access code is invalid or expired.</p>
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

  // Show error state if there's a real error (not 404)
  if (checkInError && checkInError.response?.status !== 404) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">Unable to verify check-in status. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show redirect message if guest has already checked in
  if (existingCheckIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Checked In!</h1>
          <p className="text-gray-600 mb-4">You have already completed your check-in process.</p>
          <p className="text-sm text-gray-500">Redirecting to services...</p>
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
              onClick={() => navigate(`/checkin/${accessToken}`)}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Guest Check-in</h1>
              <p className="text-sm text-gray-500">Complete your registration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Access Code</span>
              </div>
              <div className="flex-1 h-px bg-blue-600"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Personal Info</span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Services</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="label">
                  <User className="h-4 w-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('fullName', { 
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className="input"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    validate: (value: string) => isValidEmail(value) || 'Please enter a valid email address'
                  })}
                  className="input"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="label">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('phoneNumber', { 
                    required: 'Phone number is required',
                    validate: (value: string) => isValidPhone(value) || 'Please enter a valid phone number'
                  })}
                  className="input"
                  placeholder="Enter your phone number"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Passport Upload */}
              <div>
                <label className="label">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Passport/ID Document
                </label>
                <div className="mt-1">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> passport or ID
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handlePassportUpload}
                      />
                    </label>
                  </div>
                  
                  {/* File Preview */}
                  {passportPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="relative inline-block">
                        <img
                          src={passportPreview}
                          alt="Passport preview"
                          className="h-32 w-auto rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPassportPreview(null)
                            setSelectedFile(null)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedFile && !passportPreview && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          {selectedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="ml-auto text-blue-600 hover:text-blue-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload a clear photo of your passport or government-issued ID
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary btn-lg w-full"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Completing Check-in...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Check-in
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Your information is secure and will only be used for check-in purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}