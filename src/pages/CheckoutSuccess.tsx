import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Mail, Phone } from 'lucide-react'

export const CheckoutSuccess: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    // Clear cart from sessionStorage
    sessionStorage.removeItem('cartItems')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="card p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed and payment has been processed successfully.
          </p>

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-2 text-left">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Confirmation email sent to your inbox
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp confirmation message sent
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Service providers notified automatically
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/guest/${accessToken}`)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              <span>Continue Exploring Services</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact us at support@villa-upsell.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}