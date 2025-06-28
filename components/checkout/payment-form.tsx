"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Shield, Lock } from "lucide-react"
import type { StripePaymentElementOptions } from "@stripe/stripe-js"

interface PaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  customerEmail?: string
}

export function PaymentForm({ 
  clientSecret, 
  amount, 
  onSuccess,
  customerEmail 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
    paymentMethodOrder: ["card", "ideal", "sepa_debit", "klarna"],
    fields: {
      billingDetails: {
        email: customerEmail ? "never" : "auto",
      },
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    // Validate form before submission
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || "Please check your payment details")
      setIsProcessing(false)
      return
    }

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: customerEmail,
        payment_method_data: {
          billing_details: {
            email: customerEmail,
          },
        },
        save_payment_method: savePaymentMethod,
      },
      redirect: "if_required",
    })

    if (error) {
      // Handle different error types
      if (error.type === "card_error" || error.type === "validation_error") {
        setErrorMessage(error.message || "Payment failed")
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
      setIsProcessing(false)
    } else if (paymentIntent?.status === "succeeded") {
      // Payment succeeded
      onSuccess()
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Payment Information</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Billing Address */}
        <div>
          <h3 className="font-medium mb-3">Billing Address</h3>
          <AddressElement
            options={{
              mode: "billing",
              allowedCountries: ["US", "CA", "GB", "DE", "FR", "NL", "BE", "AT", "CH"],
            }}
          />
        </div>

        {/* Payment Element */}
        <div>
          <h3 className="font-medium mb-3">Payment Method</h3>
          <PaymentElement options={paymentElementOptions} />
        </div>

        {/* Save Payment Method Checkbox */}
        {customerEmail && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="save-payment"
              checked={savePaymentMethod}
              onChange={(e) => setSavePaymentMethod(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="save-payment"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Save payment method for future purchases
            </label>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
          <Shield className="h-4 w-4" />
          <span>Protected by Stripe's advanced fraud detection</span>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing payment...
            </>
          ) : (
            `Pay $${(amount / 100).toFixed(2)}`
          )}
        </Button>

        {/* Additional Payment Info */}
        <p className="text-xs text-center text-muted-foreground">
          By completing your purchase you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </Card>
  )
}