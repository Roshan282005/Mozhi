const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_API_URL = 'https://api.stripe.com/v1'

export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: Record<string, string>
}

export interface StripeCustomer {
  id: string
  email: string
  name: string
  metadata: Record<string, string>
}

export interface CreatePriceParams {
  amount: number // in cents
  currency?: string
  productName: string
  interval?: 'day' | 'week' | 'month' | 'year'
  recurring?: boolean
}

export interface StripePrice {
  id: string
  unit_amount: number
  currency: string
  product: string
  recurring?: {
    interval: string
  }
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

export interface StripeSubscription {
  id: string
  customer: string
  status: string
  current_period_start: number
  current_period_end: number
}

async function stripeFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  const response = await fetch(`${STRIPE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Stripe API error')
  }
  
  return data
}

export async function createCustomer(params: CreateCustomerParams): Promise<{ customer?: StripeCustomer; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('email', params.email)
    if (params.name) formData.append('name', params.name)
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value)
      })
    }

    const customer = await stripeFetch('/customers', {
      method: 'POST',
      body: formData,
    })

    return { customer }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getCustomer(customerId: string): Promise<{ customer?: StripeCustomer; error?: string }> {
  try {
    const customer = await stripeFetch(`/customers/${customerId}`, {
      method: 'GET',
    })
    return { customer }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createPrice(params: CreatePriceParams): Promise<{ price?: StripePrice; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('unit_amount', params.amount.toString())
    formData.append('currency', params.currency || 'eur')
    formData.append('product_data[name]', params.productName)
    
    if (params.recurring !== false) {
      formData.append('recurring[interval]', params.interval || 'month')
    }

    const price = await stripeFetch('/prices', {
      method: 'POST',
      body: formData,
    })

    return { price }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<{ subscription?: StripeSubscription; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('customer', params.customerId)
    formData.append('items[0][price]', params.priceId)
    formData.append('payment_behavior', 'default_incomplete')
    formData.append('expand[]', 'latest_invoice.payment_intent')
    
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value)
      })
    }

    const subscription = await stripeFetch('/subscriptions', {
      method: 'POST',
      body: formData,
    })

    return { subscription }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ error?: string }> {
  try {
    await stripeFetch(`/subscriptions/${subscriptionId}`, {
      method: 'POST',
      body: 'cancel_at_period_end=true',
    })
    return { error: undefined }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getSubscription(subscriptionId: string): Promise<{ subscription?: StripeSubscription; error?: string }> {
  try {
    const subscription = await stripeFetch(`/subscriptions/${subscriptionId}`, {
      method: 'GET',
    })
    return { subscription }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createCheckoutSession(params: {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('mode', 'subscription')
    formData.append('line_items[0][price]', params.priceId)
    formData.append('line_items[0][quantity]', '1')
    formData.append('success_url', params.successUrl)
    formData.append('cancel_url', params.cancelUrl)
    
    if (params.customerId) {
      formData.append('customer', params.customerId)
    }
    
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value)
      })
    }

    const session = await stripeFetch('/checkout/sessions', {
      method: 'POST',
      body: formData,
    })

    return { url: session.url }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<{ url?: string; error?: string }> {
  try {
    const formData = new URLSearchParams()
    formData.append('customer', params.customerId)
    formData.append('return_url', params.returnUrl)

    const session = await stripeFetch('/billing_portal/sessions', {
      method: 'POST',
      body: formData,
    })

    return { url: session.url }
  } catch (err: any) {
    return { error: err.message }
  }
}

export function constructWebhookEvent(payload: string, signature: string, webhookSecret: string): any {
  // In a real implementation, you'd use the stripe library
  // For now, this is a placeholder
  return JSON.parse(payload)
}