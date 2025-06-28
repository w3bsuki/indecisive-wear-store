# Stripe Local Webhook Setup

## Using Stripe CLI

Since you're using Stripe CLI for local development, here's how to set it up with your Medusa backend:

### 1. Start Stripe CLI webhook forwarding

```bash
stripe listen --forward-to localhost:9000/hooks/payment/stripe --skip-verify
```

This will output a webhook signing secret that looks like: `whsec_...`

### 2. Update your backend/.env

Replace the `STRIPE_WEBHOOK_SECRET` with the one provided by Stripe CLI.

### 3. Webhook Endpoint

The Medusa Stripe plugin automatically creates a webhook endpoint at:
```
POST http://localhost:9000/hooks/payment/stripe
```

### 4. Events Handled

The webhook handles these Stripe events:
- `payment_intent.succeeded`
- `payment_intent.canceled`
- `payment_intent.payment_failed`
- `charge.succeeded`

### 5. Testing Webhooks

With Stripe CLI running, you can trigger test events:
```bash
stripe trigger payment_intent.succeeded
```

## Alternative: Using Supabase Edge Functions

If you prefer to use Supabase as your webhook endpoint, you would need to:

1. Create a Supabase Edge Function
2. Configure it to forward events to your Medusa backend
3. Update Stripe webhook settings to point to your Supabase function URL

However, for local development, using Stripe CLI is the recommended approach.

## Current Configuration

Your backend is configured with:
- **Stripe API Key**: `pk_test_51RYWkDFh5duRtDRGGebgNsI0Kv74wx6dHorSug05ME2O4G4X62UPfgowUwzopqXb3zZD6pl6ELxmwYPRfTKduXyr00tI0GCQSh`
- **Webhook Secret**: `whsec_3abfc0fc319487cbe3440e8b53f55f5b1864de3f414cb6ca7ae525752b18da74`
- **Webhook Endpoint**: `http://localhost:9000/hooks/payment/stripe`

## Verification

To verify Stripe is working:
1. Check that the payment provider is available in your store
2. Create a test payment through the storefront
3. Monitor the Stripe CLI output for webhook events