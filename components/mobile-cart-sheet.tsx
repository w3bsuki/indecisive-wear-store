"use client"

import type React from "react"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Plus, Minus, X, CreditCard } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"

interface MobileCartSheetProps {
  cartCount: number
  children?: React.ReactNode
}

export function MobileCartSheet({ cartCount, children }: MobileCartSheetProps) {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    // Navigate to checkout page
    router.push('/checkout')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 10
  const total = subtotal + shipping

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative hover:bg-black/5 h-11 w-11 sharp-active">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-black text-white">
                {cartCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm font-mono p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-black/10">
          <SheetTitle className="text-xl font-bold uppercase tracking-wider">CART ({cart.length})</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-black/30" />
              <p className="text-black/60 font-mono">Your cart is empty</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-black/10">
                  <div className="w-20 h-20 relative flex-shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-mono font-bold text-sm">{item.name}</h4>
                      {/* Size and color can be added later when integrated with Medusa */}
                      <p className="font-mono font-bold text-sm">${item.price}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-black/20">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-black/5 min-h-[36px] min-w-[36px]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-2 font-mono text-sm min-w-[40px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-black/5 min-h-[36px] min-w-[36px]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => updateQuantity(item.id, 0)}
                        className="p-2 text-red-500 hover:bg-red-50 min-h-[36px] min-w-[36px]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary & Checkout */}
            <div className="border-t border-black/10 p-6 space-y-4">
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-black/60">Add ${(50 - subtotal).toFixed(2)} more for free shipping</p>
                )}
                <div className="flex justify-between font-bold text-base border-t border-black/10 pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full bg-black text-white hover:bg-black/80 font-mono py-4 text-base min-h-[56px]" 
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  CHECKOUT
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-2 border-black hover:bg-black hover:text-white font-mono py-4 text-base min-h-[56px]"
                >
                  VIEW CART
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
