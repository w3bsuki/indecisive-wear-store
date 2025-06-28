"use client"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe, Appearance } from "@stripe/stripe-js"
import { ReactNode } from "react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)

interface StripeProviderProps {
  children: ReactNode
  clientSecret?: string
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const appearance: Appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#000000",
      colorBackground: "#ffffff",
      colorText: "#000000",
      colorDanger: "#df1b41",
      fontFamily: '"Sora", system-ui, sans-serif',
      borderRadius: "8px",
      spacingUnit: "4px",
    },
    rules: {
      ".Label": {
        marginBottom: "8px",
        fontSize: "14px",
        fontWeight: "500",
      },
      ".Input": {
        padding: "12px",
        fontSize: "16px",
        boxShadow: "none",
        border: "1px solid #e5e5e5",
      },
      ".Input:focus": {
        border: "1px solid #000000",
        boxShadow: "0 0 0 1px #000000",
      },
      ".Input--invalid": {
        border: "1px solid #df1b41",
        boxShadow: "none",
      },
      ".Error": {
        fontSize: "14px",
        marginTop: "4px",
      },
    },
  }

  const options = clientSecret
    ? {
        clientSecret,
        appearance,
        loader: "auto" as const,
      }
    : {
        appearance,
        loader: "auto" as const,
      }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  )
}