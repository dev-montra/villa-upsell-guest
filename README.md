# Villa Upsell Guest App

The guest-facing application for the Villa Upsell system, providing a mobile-first interface for guests to check in and book upsell services.

## Features

- **Guest Check-in**: Access token validation and property welcome screen
- **Service Discovery**: Browse available upsell services by category
- **Booking System**: Complete order placement with guest information
- **Order Confirmation**: Detailed confirmation with vendor information
- **Mobile-First Design**: Optimized for mobile devices and touch interfaces

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.20.8+ (compatible versions)
- npm or yarn
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:4000`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Project Structure

```
src/
├── pages/           # Page components
│   ├── CheckIn.tsx           # Guest check-in page
│   ├── GuestDashboard.tsx    # Service browsing dashboard
│   ├── OrderForm.tsx         # Booking form
│   └── OrderConfirmation.tsx  # Order confirmation
├── lib/             # Utilities and configurations
│   ├── api.ts               # Axios configuration
│   └── utils.ts             # Helper functions
├── types/           # TypeScript type definitions
│   └── index.ts             # Type interfaces
├── App.tsx          # Main app component with routing
└── main.tsx         # Application entry point
```

## API Endpoints

The guest app communicates with the following backend endpoints:

- `GET /api/properties/access/{token}` - Validate access token and get property info
- `GET /api/properties/{id}/upsells` - Get upsells for a property
- `GET /api/upsells/{id}` - Get specific upsell details
- `POST /api/orders` - Create a new order

## User Flow

1. **Check-in**: Guest enters access token or clicks link from host
2. **Welcome**: Property information and welcome screen
3. **Browse Services**: View available upsell services by category
4. **Book Service**: Fill out booking form with guest details
5. **Confirmation**: Review order details and confirmation

## Mobile Optimization

- Responsive design with mobile-first approach
- Touch-friendly interface elements
- Optimized images and loading states
- Progressive Web App capabilities

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Deployment

The guest app is designed to be deployed as a static site and can be hosted on:

- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Integration with Backend

The guest app integrates with the villa-upsell-backend API:

- Uses access tokens for property identification
- Validates tokens on each request
- Handles authentication errors gracefully
- Provides fallback UI for offline scenarios

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Villa Upsell system and follows the same licensing terms.