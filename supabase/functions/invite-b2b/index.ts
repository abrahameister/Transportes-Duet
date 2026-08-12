import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables de entorno de Supabase no configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { email, fullName, role, cliente_corporativo_id, redirectTo } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // El rol por defecto es CLIENTE_B2B si no se especifica
    const finalRole = role || 'CLIENTE_B2B'

    // Invitar usuario mediante Admin API. Esto crea auth.users y lanza correo de reseteo.
    const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || 'https://duetgo.netlify.app/reset-password'
    })

    if (inviteError) {
      throw inviteError
    }

    const userId = authData.user.id

    // Check si el perfil ya existe para este auth_user_id (por trigger o previo)
    const { data: existingProfile } = await supabase
      .from('perfiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single()

    let perfilId = existingProfile?.id

    if (existingProfile) {
      // Actualizar el perfil existente
      await supabase
        .from('perfiles')
        .update({ rol: finalRole, nombre_completo: fullName || 'Usuario Invitado' })
        .eq('id', perfilId)
    } else {
      // Crear el perfil
      const { data: newProfile, error: profileError } = await supabase
        .from('perfiles')
        .insert([{
          auth_user_id: userId,
          email: email,
          nombre_completo: fullName || 'Usuario Invitado',
          rol: finalRole,
          estado: 'activo'
        }])
        .select()
        .single()
        
      if (profileError) throw profileError
      perfilId = newProfile.id
    }

    // Si es cliente corporativo, enlazamos
    if (finalRole === 'CLIENTE_B2B' && cliente_corporativo_id) {
      // Verificar si ya está enlazado
      const { data: existingB2b } = await supabase
        .from('usuarios_cliente_b2b')
        .select('id')
        .eq('perfil_id', perfilId)
        .eq('cliente_corporativo_id', cliente_corporativo_id)
        .single()
        
      if (!existingB2b) {
        await supabase
          .from('usuarios_cliente_b2b')
          .insert([{
            perfil_id: perfilId,
            cliente_corporativo_id: cliente_corporativo_id
          }])
      }
    }

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error en invite-b2b:', error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: 'Ha ocurrido un error al procesar la solicitud. Por favor, intente nuevamente.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
