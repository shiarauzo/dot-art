import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()

    // Polar webhook events: checkout.created, checkout.updated, order.created
    if (body.type === 'order.created' || body.type === 'checkout.updated') {
      const email = body.data?.customer?.email ||
                    body.data?.metadata?.user_email

      if (email && body.data?.status === 'succeeded') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('email', email)

        if (error) {
          console.error('Error updating profile:', error)
          return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log(`Upgraded ${email} to pro`)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
