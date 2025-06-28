import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const sig = req.headers["stripe-signature"] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const paymentModule = req.scope.resolve<IPaymentModuleService>(
    Modules.PAYMENT
  )

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, paymentModule)
        break
      
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, paymentModule)
        break
      
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object as Stripe.Dispute, paymentModule)
        break
      
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, paymentModule)
        break
      
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, paymentModule)
        break
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook: ${error}`)
    res.status(500).json({ error: "Webhook processing failed" })
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  paymentModule: IPaymentModuleService
) {
  // Update payment status in Medusa
  console.log(`Payment ${paymentIntent.id} succeeded`)
  
  // Find the payment session by payment intent ID
  try {
    const payments = await paymentModule.listPayments({
      provider_id: "pp_stripe_stripe",
      data: {
        id: paymentIntent.id
      }
    })

    if (payments.length > 0) {
      await paymentModule.updatePayment({
        id: payments[0].id,
        data: {
          status: "captured"
        }
      })
    }
  } catch (error) {
    console.error("Error updating payment status:", error)
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  paymentModule: IPaymentModuleService
) {
  // Handle failed payment
  console.log(`Payment ${paymentIntent.id} failed: ${paymentIntent.last_payment_error?.message}`)
  
  try {
    const payments = await paymentModule.listPayments({
      provider_id: "pp_stripe_stripe",
      data: {
        id: paymentIntent.id
      }
    })

    if (payments.length > 0) {
      await paymentModule.updatePayment({
        id: payments[0].id,
        data: {
          status: "failed",
          error_message: paymentIntent.last_payment_error?.message
        }
      })
    }
  } catch (error) {
    console.error("Error updating failed payment:", error)
  }
}

async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  paymentModule: IPaymentModuleService
) {
  // Handle dispute/chargeback
  console.log(`Dispute created: ${dispute.id}`)
  
  // Log dispute details for manual review
  console.log({
    dispute_id: dispute.id,
    amount: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
    status: dispute.status,
    payment_intent: dispute.payment_intent,
  })
  
  // TODO: Implement dispute handling workflow
  // - Notify admin
  // - Flag order for review
  // - Gather evidence if needed
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  paymentModule: IPaymentModuleService
) {
  // Handle refund
  console.log(`Charge ${charge.id} refunded`)
  
  try {
    const payments = await paymentModule.listPayments({
      provider_id: "pp_stripe_stripe",
      data: {
        id: charge.payment_intent
      }
    })

    if (payments.length > 0) {
      // Create refund record
      await paymentModule.refundPayment({
        payment_id: payments[0].id,
        amount: charge.amount_refunded,
        reason: "customer_request"
      })
    }
  } catch (error) {
    console.error("Error processing refund:", error)
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  paymentModule: IPaymentModuleService
) {
  // Handle completed checkout session
  console.log(`Checkout session ${session.id} completed`)
  
  // Additional processing if using Stripe Checkout
  // This might include order confirmation, inventory updates, etc.
}