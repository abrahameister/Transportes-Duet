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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided by the client.');
    }

    // Create a Supabase client with the Auth context of the user calling the function.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Using the explicit token for getUser is more reliable in Edge Functions
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized. Token validation failed: ' + (userError?.message || 'Unknown error'));
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
    let userId = null;
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        rol: role || 'cliente_corporativo',
        nombre_completo: fullName
      }
    })

    if (inviteError) {
      // Check if user already exists
      if (inviteError.message?.toLowerCase().includes('already registered') || inviteError.status === 422 || inviteError.status === 400) {
        // Find existing user in perfiles
        const { data: existingProfile, error: searchError } = await supabaseAdmin.from('perfiles').select('id').eq('email', email).single()
        if (existingProfile) {
          userId = existingProfile.id
        } else {
          // It's possible the user exists in auth.users but NOT in perfiles. We can't query auth.users by email easily without listUsers
          // So we just throw the original error with a helpful message
          throw new Error('El correo ingresado ya existe en la base de datos (Auth), pero no tiene un perfil asociado. Intenta con un correo diferente.')
        }
      } else {
        throw inviteError
      }
    } else {
      userId = inviteData.user.id
    }

    // 2. Insert or update into perfiles
    const { error: profileError } = await supabaseAdmin.from('perfiles').upsert({
      id: userId,
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
