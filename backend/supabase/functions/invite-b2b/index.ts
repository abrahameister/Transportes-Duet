import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, fullName, cliente_corporativo_id } = await req.json()

    // Create a Supabase client with the Auth context of the user calling the function.
    // We check if they are authenticated.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized - Must be logged in')
    }

    // Verify if the caller is an admin (Optional extra security, assuming RLS already protects the tables)
    // We create an ADMIN client (Service Role) to bypass RLS and invite the user.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify caller role in perfiles OR via domain check
    let isAdmin = false;
    const userEmail = (user.email || '').toLowerCase();
    
    if (userEmail.endsWith('@duetsolutions.cl') || userEmail.endsWith('@neiratransportes.cl')) {
      isAdmin = true;
    } else {
      const { data: callerProfile } = await supabaseAdmin
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()
        
      if (callerProfile?.rol === 'admin') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      throw new Error('Unauthorized - Must be an admin to invite B2B clients')
    }

    // 1. Invite the user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        rol: role || 'cliente_corporativo',
        nombre_completo: fullName
      }
    })

    if (inviteError) {
      throw inviteError
    }

    // 2. Insert into perfiles
    const { error: profileError } = await supabaseAdmin.from('perfiles').upsert({
      id: inviteData.user.id,
      rol: role || 'cliente_corporativo',
      nombre_completo: fullName,
      email: email,
      cliente_corporativo_id: cliente_corporativo_id
    })

    if (profileError) {
      throw profileError
    }

    return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
