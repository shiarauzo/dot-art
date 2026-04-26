// Lemon Squeezy checkout integration
//
// To set up:
// 1. Create a Lemon Squeezy account at https://lemonsqueezy.com
// 2. Create a product with $2.99 price
// 3. Get your store URL and product variant ID
// 4. Set up a webhook to update user's is_pro status in Supabase
//
// Webhook setup:
// - Create a Supabase Edge Function to handle webhooks
// - Verify webhook signature
// - Update profiles table: is_pro = true for the user's email

const STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || ''
const PRODUCT_VARIANT_ID = import.meta.env.VITE_LEMONSQUEEZY_VARIANT_ID || ''

export function getCheckoutUrl(email: string): string {
  // Lemon Squeezy checkout URL format
  // The email will be pre-filled in the checkout form
  const baseUrl = `https://${STORE_ID}.lemonsqueezy.com/buy/${PRODUCT_VARIANT_ID}`

  const params = new URLSearchParams({
    'checkout[email]': email,
    'checkout[custom][user_email]': email,
  })

  return `${baseUrl}?${params.toString()}`
}

// Supabase Edge Function for webhook (deploy separately)
//
// Create file: supabase/functions/lemon-webhook/index.ts
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const body = await req.json()

  // Verify webhook signature (implement based on Lemon Squeezy docs)

  if (body.meta.event_name === 'order_created') {
    const email = body.data.attributes.user_email

    // Update user's profile to pro
    await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('email', email)
  }

  return new Response('OK', { status: 200 })
})
*/
