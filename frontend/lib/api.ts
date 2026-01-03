// Ensure API_BASE_URL always ends with /api
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cse-471-tariquzzamans-projects.vercel.app'
const API_BASE_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  image_urls?: string[]
  image?: string[] // Backend sometimes returns 'image' instead of 'image_urls'
  rating?: number
  category?: string
  brand?: string
  stock?: number
  status?: string
  size?: any
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface Review {
  id: string
  product_id: string
  user_name: string
  rating: number
  comment?: string
  posted_date?: string
  created_at?: string
  is_verified_purchase?: boolean
}

export interface SizeChartData {
  template_id: number
  columns: Array<{
    id: number
    column_key: string
    display_name: string
    unit: string
  }>
  rows: Array<{
    id: number
    size_label: string
  }>
  values: Array<{
    row_id: number
    column_id: number
    value: string
  }>
}

export interface CartItem {
  id: string
  session_id?: string
  product_id: string
  quantity: number
  price: number
  size?: string
  products?: {
    name?: string
    image_url?: string
    image_urls?: string[]
    description?: string
  }
}

export interface CartResponse {
  items: CartItem[]
  subtotal: number
}

// Products API
export async function getProducts(params?: {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  search?: string
  tag?: string
}): Promise<ApiResponse<Product[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.category) queryParams.append('category', params.category)
    if (params?.minPrice) queryParams.append('min_price', params.minPrice.toString())
    if (params?.maxPrice) queryParams.append('max_price', params.maxPrice.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.search) queryParams.append('q', params.search)
    if (params?.tag) queryParams.append('tag', params.tag)

    const response = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch products'
    }
  }
}

export async function getProduct(productId: string): Promise<ApiResponse<Product>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product'
    }
  }
}

export async function getNewArrivals(): Promise<ApiResponse<Product[]>> {
  try {
    // Use the same API as Product Page with sort=newest
    const response = await fetch(`${API_BASE_URL}/products?sort=newest&limit=4&page=1`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch new arrivals'
    }
  }
}

export async function getBestSelling(): Promise<ApiResponse<Product[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/best-selling`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch best sellers'
    }
  }
}

export async function getTopSelling(): Promise<ApiResponse<Product[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/best-selling?limit=4`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch top sellers'
    }
  }
}

export async function getRelatedProducts(productId: string): Promise<ApiResponse<Product[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/related`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch related products'
    }
  }
}

export async function getProductCategories(): Promise<ApiResponse<string[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories'
    }
  }
}

export async function getProductSizeChart(productId: string): Promise<ApiResponse<SizeChartData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/size-chart`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch size chart'
    }
  }
}

export async function getProductReviews(productId: string, userId?: string): Promise<ApiResponse<Review[]>> {
  try {
    const url = userId 
      ? `${API_BASE_URL}/products/${productId}/reviews?user_id=${userId}`
      : `${API_BASE_URL}/products/${productId}/reviews`
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reviews'
    }
  }
}

export async function addProductReview(
  productId: string,
  review: {
    user_name: string
    rating: number
    comment?: string
    user_id?: string
  }
): Promise<ApiResponse<Review>> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add review'
    }
  }
}

// Cart API
export async function getCart(sessionId: string): Promise<ApiResponse<CartResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart?session_id=${sessionId}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch cart'
    }
  }
}

export async function addToCart(item: {
  session_id: string
  product_id: string
  quantity: number
  price: number
  size?: string
  color?: string
}): Promise<ApiResponse<CartItem>> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to cart'
    }
  }
}

export async function updateCartItem(
  cartItemId: string,
  updates: {
    quantity?: number
    size?: string
    color?: string
  }
): Promise<ApiResponse<CartItem>> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cart item'
    }
  }
}

export async function removeCartItem(cartItemId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove cart item'
    }
  }
}

// Orders API
export interface CreateOrderRequest {
  session_id: string
  customer: {
    full_name: string
    email: string
    phone_number: string
    district: string
    thana: string
    full_address: string
  }
  discount_percentage?: number
  discount_amount?: number
  delivery_fee?: number
  user_id?: string
}

export async function createOrder(order: CreateOrderRequest): Promise<ApiResponse<{ order_id: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    }
  }
}

// OTP API
export async function sendOTP(phoneNumber: string): Promise<ApiResponse<{ phone_number: string; expires_in: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    }
  }
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<ApiResponse<{ phone_number: string; verified: boolean }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber, otp: otp })
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP'
    }
  }
}

export async function checkOTPVerification(phoneNumber: string): Promise<ApiResponse<{ verified: boolean }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/otp/check-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: phoneNumber })
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check verification'
    }
  }
}

// Wishlist API
export interface WishlistItem {
  id: string
  product_id: string
  name: string
  price: number
  image: string
  rating: number
  created_at: string
}

export async function getWishlist(userId: string): Promise<ApiResponse<WishlistItem[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wishlist?user_id=${userId}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wishlist'
    }
  }
}

export async function addToWishlist(userId: string, productId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, product_id: productId })
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to wishlist'
    }
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/wishlist?user_id=${userId}&product_id=${productId}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from wishlist'
    }
  }
}

// Discount/Promo Code API
export async function validatePromoCode(code: string): Promise<ApiResponse<{
  id: string
  code: string
  discount: number
  type: 'percentage' | 'amount'
  expiration_date: string
  status: string
  usage_count: number
  usage_limit: number
  min_order_value: number
}>> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/discounts/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate promo code'
    }
  }
}

// User Profile API
export interface UserProfile {
  id?: string
  user_id: string
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  email_notifications?: boolean
  order_updates?: boolean
  promotional_emails?: boolean
  sms_notifications?: boolean
  created_at?: string
  updated_at?: string
}

export async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile?user_id=${userId}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user profile'
    }
  }
}

export async function updateUserProfile(profile: UserProfile): Promise<ApiResponse<UserProfile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user profile'
    }
  }
}

// User Orders API
export interface UserOrder {
  id: string
  order_number: string
  date: string
  status: string
  total: number
  subtotal: number
  discount: number
  delivery_fee: number
  customer: {
    full_name: string
    phone_number: string
    district: string
    thana: string
    full_address: string
  }
  items: Array<{
    id: string
    product_id: string
    product_name: string
    product_image?: string
    size?: string
    color?: string
    quantity: number
    price: number
  }>
}

export async function getUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<UserOrder[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/orders?user_id=${userId}&page=${page}&limit=${limit}`)
    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user orders'
    }
  }
}
