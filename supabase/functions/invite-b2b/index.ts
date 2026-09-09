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
      throw new Error('Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas en Supabase.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { 
      email, 
      fullName, 
      role, 
      cliente_corporativo_id, 
      redirectTo, 
      rut, 
      telefono, 
      tipoLicencia, 
      vencimientoLicencia 
    } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Se requiere un correo electrónico válido.' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const rawRole = (role || 'CLIENTE_B2B').toUpperCase()
    const validRoles = ['ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B']
    const finalRole = validRoles.includes(rawRole) ? rawRole : 'CLIENTE_B2B'
    const targetRedirect = redirectTo || 'https://duetgo.netlify.app/reset-password'

    let userId: string | null = null
    let isExistingUser = false
    let actionLink: string | null = null
    let emailSent = false

    // 1. Buscar si el usuario ya existe en auth.users
    const { data: listData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    })
    
    const existingAuthUser = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    )

    if (existingAuthUser) {
      userId = existingAuthUser.id
      isExistingUser = true
    } else {
      // 2. Si es usuario nuevo, intentar invitarlo por email primero
      try {
        const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
          redirectTo: targetRedirect,
          data: {
            rol: finalRole,
            nombre_completo: fullName || 'Usuario Corporativo'
          }
        })
        if (!inviteErr && inviteData?.user) {
          userId = inviteData.user.id
          emailSent = true
        } else if (inviteErr) {
          console.warn('inviteUserByEmail aviso:', inviteErr.message)
        }
      } catch (err) {
        console.warn('inviteUserByEmail excepción:', err)
      }

      // Si falló inviteUserByEmail (ej. SMTP rate limits de Supabase), crear el usuario directamente
      if (!userId) {
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: {
            rol: finalRole,
            nombre_completo: fullName || 'Usuario Corporativo'
          }
        })
        if (createError) {
          // Si por concurrencia ya existía
          const { data: retryList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const found = retryList?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
          if (found) {
            userId = found.id
            isExistingUser = true
          } else {
            throw new Error(`Error al registrar usuario en Supabase Auth: ${createError.message}`)
          }
        } else if (createData?.user) {
          userId = createData.user.id
        }
      }
    }

    if (!userId) {
      throw new Error('No fue posible resolver o crear el usuario en Supabase Auth.')
    }

    // 3. Generar enlace criptográfico seguro de acceso / restablecimiento
    try {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: targetRedirect
        }
      })
      if (!linkErr && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link
      }
    } catch (linkEx) {
      console.warn('No se pudo generar action_link:', linkEx)
    }

    // 4. Crear o actualizar el perfil en la tabla 'perfiles'
    const { data: existingProfile } = await supabase
      .from('perfiles')
      .select('id, rol, estado')
      .or(`auth_user_id.eq.${userId},email.eq.${cleanEmail}`)
      .maybeSingle()

    let perfilId: string

    if (existingProfile) {
      perfilId = existingProfile.id
      const { error: updateProfileErr } = await supabase
        .from('perfiles')
        .update({
          auth_user_id: userId,
          rol: finalRole,
          nombre_completo: fullName || 'Usuario Invitado',
          estado: 'activo',
          email: cleanEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', perfilId)

      if (updateProfileErr) throw updateProfileErr
    } else {
      const { data: newProfile, error: profileError } = await supabase
        .from('perfiles')
        .insert([{
          auth_user_id: userId,
          email: cleanEmail,
          nombre_completo: fullName || 'Usuario Invitado',
          rol: finalRole,
          estado: 'activo'
        }])
        .select('id')
        .single()
        
      if (profileError) throw profileError
      perfilId = newProfile.id
    }

    // 5. Si es CLIENTE_B2B, asociar a la empresa en 'usuarios_cliente_b2b'
    if (finalRole === 'CLIENTE_B2B' && cliente_corporativo_id) {
      const { data: existingB2b } = await supabase
        .from('usuarios_cliente_b2b')
        .select('id')
        .eq('perfil_id', perfilId)
        .eq('cliente_corporativo_id', cliente_corporativo_id)
        .maybeSingle()
        
      if (!existingB2b) {
        const { error: b2bError } = await supabase
          .from('usuarios_cliente_b2b')
          .insert([{
            perfil_id: perfilId,
            cliente_corporativo_id: cliente_corporativo_id
          }])
        if (b2bError) {
          console.warn('Aviso vinculando usuarios_cliente_b2b:', b2bError.message)
        }
      }
    }

    // 6. Si es CONDUCTOR, asociar o crear en 'conductores'
    if (finalRole === 'CONDUCTOR') {
      const { data: existingCond } = await supabase
        .from('conductores')
        .select('id')
        .eq('perfil_id', perfilId)
        .maybeSingle()

      if (!existingCond) {
        await supabase
          .from('conductores')
          .insert([{
            perfil_id: perfilId,
            rut: rut || ('RUT-' + userId.slice(0, 8)),
            nombre_completo: fullName || 'Conductor',
            telefono: telefono || '+56900000000',
            tipo_licencia: tipoLicencia || 'A2',
            vencimiento_licencia: vencimientoLicencia || null,
            estado: 'activo',
            email: cleanEmail
          }])
      } else {
        await supabase
          .from('conductores')
          .update({
            estado: 'activo',
            email: cleanEmail
          })
          .eq('id', existingCond.id)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userId, 
      perfilId,
      actionLink,
      emailSent,
      isExistingUser,
      message: isExistingUser 
        ? 'Usuario corporativo existente vinculado y actualizado exitosamente.'
        : 'Invitación y credenciales generadas exitosamente.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error detallado en invite-b2b:', errorMsg)
    return new Response(JSON.stringify({ 
      error: errorMsg,
      details: String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
