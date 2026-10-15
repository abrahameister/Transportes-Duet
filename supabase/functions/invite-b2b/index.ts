import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Convierte cualquier valor de error a string legible */
function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string') {
      const detail = e.details ? ` | details: ${e.details}` : ''
      const hint   = e.hint   ? ` | hint: ${e.hint}`       : ''
      const code   = e.code   ? ` | code: ${e.code}`       : ''
      return `${e.message}${detail}${hint}${code}`
    }
    return JSON.stringify(error)
  }
  return String(error)
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

    // ==============================================================================
    // 1. AUTORIZACION ESTRICTA DEL INVOCADOR
    // ==============================================================================
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado: cabecera Authorization requerida.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const jwtToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    const { data: callerAuth, error: callerAuthErr } = await supabase.auth.getUser(jwtToken)

    if (callerAuthErr || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: 'Sesion invalida o expirada.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Consultar perfil del solicitante
    const { data: callerProfile, error: callerProfileErr } = await supabase
      .from('perfiles')
      .select('id, rol, estado, email')
      .eq('auth_user_id', callerAuth.user.id)
      .maybeSingle()

    if (callerProfileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: 'Perfil del usuario solicitante no encontrado.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (callerProfile.estado !== 'activo') {
      return new Response(JSON.stringify({ error: 'El usuario solicitante no se encuentra activo.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const callerRole = callerProfile.rol
    if (!['ADMIN', 'OPERACIONES'].includes(callerRole)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: solo personal de ADMIN u OPERACIONES puede invitar o crear cuentas.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ==============================================================================
    // 2. VALIDACION DEL PAYLOAD Y ROLES
    // ==============================================================================
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
      return new Response(JSON.stringify({ error: 'Se requiere un correo electronico valido.' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const rawRole = (role || 'CLIENTE_B2B').toUpperCase()
    const validRoles = ['ADMIN', 'OPERACIONES', 'DISPATCHER', 'CONDUCTOR', 'CLIENTE_B2B']
    const finalRole = validRoles.includes(rawRole) ? rawRole : 'CLIENTE_B2B'
    const targetRedirect = redirectTo || 'https://duetgo.netlify.app/reset-password'

    // Restriccion jerarquica: Solo ADMIN puede asignar rol ADMIN u OPERACIONES
    if (['ADMIN', 'OPERACIONES'].includes(finalRole) && callerRole !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Solo un ADMIN puede asignar roles de ADMIN u OPERACIONES.' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Evitar que el usuario modifique su propio rol
    if (callerProfile.email?.toLowerCase() === cleanEmail && finalRole !== callerProfile.rol) {
      return new Response(JSON.stringify({ error: 'No esta permitido modificar el propio rol de la cuenta activa.' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Si es CLIENTE_B2B, verificar que la empresa existe
    if (finalRole === 'CLIENTE_B2B' && cliente_corporativo_id) {
      const { data: clientCheck } = await supabase
        .from('clientes_corporativos')
        .select('id, nombre_corporativo')
        .eq('id', cliente_corporativo_id)
        .maybeSingle()

      if (!clientCheck) {
        return new Response(JSON.stringify({ error: 'El cliente corporativo especificado no existe.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    let userId: string | null = null
    let isExistingUser = false
    let actionLink: string | null = null
    let emailSent = false

    // ==============================================================================
    // 3. BUSCAR O CREAR USUARIO EN auth.users CON METADATOS AUTORIZADOS
    // ==============================================================================
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

      // Actualizar metadatos autorizados en auth.users
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { rol: finalRole },
        user_metadata: {
          rol: finalRole,
          nombre_completo: fullName || existingAuthUser.user_metadata?.nombre_completo || 'Usuario Corporativo'
        }
      })
    } else {
      // Si es usuario nuevo, invitarlo por email (envia correo de bienvenida via SMTP)
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

          // Asegurar app_metadata protegido
          await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { rol: finalRole }
          })
        } else if (inviteErr) {
          console.warn('inviteUserByEmail aviso:', serializeError(inviteErr))
        }
      } catch (err) {
        console.warn('inviteUserByEmail excepcion:', serializeError(err))
      }

      // Fallback si no fue posible invitar por correo (ej. SMTP restringido): crear usuario
      if (!userId) {
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          app_metadata: { rol: finalRole },
          user_metadata: {
            rol: finalRole,
            nombre_completo: fullName || 'Usuario Corporativo'
          }
        })

        if (createError) {
          const { data: retryList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const found = retryList?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
          if (found) {
            userId = found.id
            isExistingUser = true
          } else {
            throw new Error(`Error al registrar usuario en Supabase Auth: ${serializeError(createError)}`)
          }
        } else if (createData?.user) {
          userId = createData.user.id
        }
      }
    }

    if (!userId) {
      throw new Error('No fue posible resolver o crear el usuario en Supabase Auth.')
    }

    // ==============================================================================
    // 4. GENERAR ENLACE DE ACCESO / RECUPERACION SEGURO
    // ==============================================================================
    try {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: { redirectTo: targetRedirect }
      })
      if (!linkErr && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link
      } else if (linkErr) {
        console.warn('No se pudo generar action_link:', serializeError(linkErr))
      }
    } catch (linkEx) {
      console.warn('No se pudo generar action_link (excepcion):', serializeError(linkEx))
    }

    // ==============================================================================
    // 5. CREAR O ACTUALIZAR PERFIL EN TABLA 'perfiles'
    // ==============================================================================
    let existingProfile: { id: string; rol: string; estado: string } | null = null

    const byAuthId = await supabase
      .from('perfiles')
      .select('id, rol, estado')
      .eq('auth_user_id', userId)
      .maybeSingle()
    
    if (byAuthId.data) {
      existingProfile = byAuthId.data
    } else {
      const byEmail = await supabase
        .from('perfiles')
        .select('id, rol, estado')
        .eq('email', cleanEmail)
        .maybeSingle()
      existingProfile = byEmail.data
    }

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

      if (updateProfileErr) {
        throw new Error(`Error actualizando perfil [id=${perfilId}]: ${serializeError(updateProfileErr)}`)
      }
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
        
      if (profileError) {
        throw new Error(`Error insertando perfil [email=${cleanEmail}]: ${serializeError(profileError)}`)
      }
      perfilId = newProfile.id
    }

    // ==============================================================================
    // 6. ASOCIACIONES B2B Y CONDUCTOR SIN DUPLICIDADES
    // ==============================================================================
    if (finalRole === 'CLIENTE_B2B' && cliente_corporativo_id) {
      const { data: existingB2b } = await supabase
        .from('usuarios_cliente_b2b')
        .select('id')
        .eq('perfil_id', perfilId)
        .eq('cliente_corporativo_id', cliente_corporativo_id)
        .maybeSingle()
        
      if (!existingB2b) {
        await supabase
          .from('usuarios_cliente_b2b')
          .insert([{
            perfil_id: perfilId,
            cliente_corporativo_id: cliente_corporativo_id
          }])
      }

      // Marcar invitacion_enviada en clientes_corporativos
      await supabase
        .from('clientes_corporativos')
        .update({ invitacion_enviada: true, updated_at: new Date().toISOString() })
        .eq('id', cliente_corporativo_id)
    }

    if (finalRole === 'CONDUCTOR') {
      const cleanRut = (rut || '').trim() || null

      // Buscar si ya existe por perfil_id, por email o por rut
      let existingCondQuery = supabase
        .from('conductores')
        .select('id')
        .eq('perfil_id', perfilId)
        .maybeSingle()

      let { data: existingCond } = await existingCondQuery

      if (!existingCond && cleanRut) {
        const { data: byRut } = await supabase
          .from('conductores')
          .select('id')
          .eq('rut', cleanRut)
          .maybeSingle()
        existingCond = byRut
      }

      if (!existingCond) {
        const { data: byEmail } = await supabase
          .from('conductores')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle()
        existingCond = byEmail
      }

      if (!existingCond) {
        const { error: condError } = await supabase
          .from('conductores')
          .insert([{
            perfil_id: perfilId,
            rut: cleanRut || ('RUT-' + userId.slice(0, 8)),
            nombre_completo: fullName || 'Conductor',
            telefono: telefono || '+56900000000',
            tipo_licencia: tipoLicencia || 'A2',
            vencimiento_licencia: vencimientoLicencia || null,
            estado: 'activo',
            email: cleanEmail
          }])
        if (condError) {
          console.warn('Aviso insertando conductor:', serializeError(condError))
        }
      } else {
        await supabase
          .from('conductores')
          .update({
            perfil_id: perfilId,
            estado: 'activo',
            email: cleanEmail,
            nombre_completo: fullName || undefined,
            telefono: telefono || undefined,
            tipo_licencia: tipoLicencia || undefined,
            vencimiento_licencia: vencimientoLicencia || undefined,
            updated_at: new Date().toISOString()
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
        : 'Invitacion y credenciales generadas exitosamente.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    const errorMsg = serializeError(error)
    console.error('Error en invite-b2b:', errorMsg)
    return new Response(JSON.stringify({ 
      error: errorMsg
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})