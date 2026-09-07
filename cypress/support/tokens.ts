/**
 * Helpers para manipular el token que la app envía al backend.
 *
 * Las pruebas usan la API real, así que aquí no se falsifican sesiones: lo
 * único que se fabrica es un token *inválido* con el que comprobar que el
 * backend lo rechaza.
 */

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Un token con la forma de un ID token de Firebase pero caducado hace una hora
 * y sin firma válida. Sirve para el caso «token vencido»: ninguna clave de
 * Firebase lo respalda, así que el backend debe rechazarlo igual que a uno
 * expirado de verdad — que es lo que no podemos fabricar sin la clave privada
 * de Google.
 */
export function makeExpiredIdToken(uid = 'uid-caducado'): string {
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', kid: 'caducado', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: 'https://securetoken.google.com/evd',
      aud: 'evd',
      auth_time: now - 7200,
      user_id: uid,
      sub: uid,
      iat: now - 7200,
      exp: now - 3600,
      firebase: { identities: {}, sign_in_provider: 'password' },
    }),
  )

  return `${header}.${payload}.firma-invalida`
}

/** El JWT de una cabecera `Authorization: Bearer …`, o `''` si no hay. */
export function bearerToken(header?: string): string {
  if (!header?.startsWith('Bearer ')) return ''

  return header.slice('Bearer '.length)
}

/** El payload decodificado de un ID token de Firebase. */
export function decodeToken(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]

  if (!payload) return {}

  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}
