export interface User {
  id: string
  email: string
  fullName: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  avatarUrl?: string
  bio?: string
  subscriptionTier?: 'FREE' | 'PRO' | 'PLUS'
  xp?: number
  streak?: number
  createdAt?: string
}

export interface Companion {
  id: string
  userId: string
  displayName: string
  bio?: string
  city?: string
  country?: string
  showLocation: boolean
  languagesSpoken: string[]
  styleTags: string[]
  sessionStyleDesc?: string
  introVideoUrl?: string
  sampleContentUrl?: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  demoSessionEnabled: boolean
  avatarUrl?: string
  avgRating?: number
  reviewCount?: number
  pricingPlans?: PricingPlan[]
}

export interface PricingPlan {
  id: string
  companionId: string
  label: string
  sessionsPerMonth: number
  priceEur: number
  isActive: boolean
}

export interface AvailabilitySlot {
  id: string
  companionId: string
  dayOfWeek: number
  startTime: string
  durationMins: 30 | 60
  timezone: string
  isActive: boolean
}

export interface Session {
  id: string
  subscriptionId: string
  explorerId: string
  companionId: string
  scheduledAt: string
  durationMins: number
  status: 'scheduled' | 'room_created' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  dailyRoomUrl?: string
  dailyRoomName?: string
  companion?: Companion
  explorer?: User
}

export interface Review {
  id: string
  sessionId: string
  explorerId: string
  companionId: string
  rating: number
  body?: string
  companionReply?: string
  createdAt: string
  explorer?: User
}

export interface Message {
  id: string
  subscriptionId: string
  senderId: string
  body: string
  readAt?: string
  createdAt: string
  sender?: User
}

export interface Subscription {
  id: string
  explorerId: string
  companionId: string
  planId: string
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  paymentProvider: 'stripe' | 'razorpay'
  providerSubId: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  companion?: Companion
  plan?: PricingPlan
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}
