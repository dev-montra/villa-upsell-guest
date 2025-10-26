import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { CheckIn } from './pages/CheckIn'
import { GuestCheckInForm } from './pages/GuestCheckInForm'
import { GuestDashboard } from './pages/GuestDashboard'
import { Checkout } from './pages/Checkout'
import { CheckoutSuccess } from './pages/CheckoutSuccess'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/checkin/:accessToken" element={<CheckIn />} />
            <Route path="/checkin-form/:accessToken" element={<GuestCheckInForm />} />
            <Route path="/guest/:accessToken" element={<GuestDashboard />} />
            <Route path="/checkout/:accessToken" element={<Checkout />} />
            <Route path="/checkout/success/:accessToken" element={<CheckoutSuccess />} />
            <Route path="*" element={<CheckIn />} />
          </Routes>
        </div>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  )
}

export default App