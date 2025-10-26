export interface Property {
  id: number
  name: string
  description: string
  instagram_url?: string
  language: string
  currency: string
  tags: string[]
  hero_image_url?: string
  access_token: string
  payment_processor: 'stripe' | 'wise'
  payout_schedule: 'manual' | 'weekly' | 'monthly'
  wise_account_details?: {
    bank_name?: string
    account_number?: string
    routing_number?: string
    swift_code?: string
    account_holder_name?: string
    instructions?: string
  }
  created_at: string
  updated_at: string
}

export interface Upsell {
  id: number
  title: string
  description: string
  price: number
  category: string
  image_url?: string
  is_active: boolean
  sort_order: number
  property_id: number
  primary_vendor_id: number
  secondary_vendor_id?: number
  availability_rules?: any
  created_at: string
  updated_at: string
  property?: Property
  primary_vendor?: Vendor
  secondary_vendor?: Vendor
}

export interface Vendor {
  id: number
  name: string
  email: string
  phone?: string
  whatsapp_number?: string
  service_type: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  property_id: number
  upsell_id: number
  vendor_id: number
  guest_name: string
  guest_email: string
  guest_phone?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  notes?: string
  scheduled_date?: string
  created_at: string
  updated_at: string
  property?: Property
  upsell?: Upsell
  vendor?: Vendor
}

export interface GuestSession {
  property: Property
  access_token: string
  expires_at: string
}

export interface OrderFormData {
  guest_name: string
  guest_email: string
  guest_phone?: string
  notes?: string
  scheduled_date?: string
}