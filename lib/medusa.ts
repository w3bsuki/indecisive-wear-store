const MEDUSA_BACKEND_URL = 'http://localhost:9000'
const PUBLISHABLE_API_KEY = 'pk_818e3859773edbb04d7d292272327e3d740a2abeca89e278a72cd543e50c0989'

export interface MedusaProduct {
  id: string
  title: string
  description: string
  handle: string
  thumbnail: string
  images: Array<{
    id: string
    url: string
  }>
  variants: Array<{
    id: string
    title: string
    sku: string
    options: Array<{
      value: string
      option: {
        title: string
      }
    }>
  }>
  options: Array<{
    id: string
    title: string
    values: Array<{
      id: string
      value: string
    }>
  }>
}

export interface MedusaProductsResponse {
  products: MedusaProduct[]
}

class MedusaService {
  private baseUrl = MEDUSA_BACKEND_URL
  private apiKey = PUBLISHABLE_API_KEY

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': this.apiKey,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getProducts(limit = 20): Promise<MedusaProduct[]> {
    // Get newest products first (your Хулиганка hats will appear first)
    const data: MedusaProductsResponse = await this.fetch(`/store/products?limit=${limit}&order=-created_at`)
    return data.products
  }

  async getProduct(id: string): Promise<MedusaProduct> {
    const data = await this.fetch(`/store/products/${id}`)
    return data.product
  }

  async createCart() {
    const data = await this.fetch('/store/carts', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    return data.cart
  }

  async addToCart(cartId: string, variantId: string, quantity: number = 1) {
    const data = await this.fetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: variantId,
        quantity,
      }),
    })
    return data.cart
  }

  async getCart(cartId: string) {
    const data = await this.fetch(`/store/carts/${cartId}`)
    return data.cart
  }
}

export const medusaService = new MedusaService()