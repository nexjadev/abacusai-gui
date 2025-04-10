import { ref } from 'vue'
import { getApiUrl } from './appConfig'
import { useNotification } from './notification'
import * as forge from 'node-forge'
import { User } from "../dtos/user.dto.ts";

// Clave secreta para encriptación (en producción debería estar en variables de entorno)
const ENCRYPTION_KEY = 'a8D3f5jXzQp2L9Nv'

// Funciones de encriptación y desencriptación
const encryptData = (data: string): string => {
  // Generar IV aleatorio
  const iv = forge.random.getBytesSync(12)

  // Derivar clave usando PBKDF2
  const salt = forge.random.getBytesSync(16)
  const key = forge.pkcs5.pbkdf2(ENCRYPTION_KEY, salt, 10000, 32)

  // Crear cipher
  const cipher = forge.cipher.createCipher('AES-GCM', key)
  cipher.start({ iv: iv })
  cipher.update(forge.util.createBuffer(data, 'utf8'))
  cipher.finish()

  // Obtener tag de autenticación
  const tag = cipher.mode.tag!

  // Combinar todos los componentes
  const encrypted = forge.util.encode64(salt + iv + cipher.output.getBytes() + tag.getBytes())

  return encrypted
}

const decryptData = (encryptedData: string): string => {
  try {
    // Decodificar datos
    const combined = forge.util.decode64(encryptedData)

    // Extraer componentes
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const tag = combined.slice(-16)
    const encrypted = combined.slice(28, -16)

    // Derivar clave
    const key = forge.pkcs5.pbkdf2(ENCRYPTION_KEY, salt, 10000, 32)

    // Crear decipher
    const decipher = forge.cipher.createDecipher('AES-GCM', key)
    decipher.start({
      iv: iv,
      tag: forge.util.createBuffer(tag)
    })

    decipher.update(forge.util.createBuffer(encrypted))
    const pass = decipher.finish()

    if (!pass) {
      throw new Error('Falló la verificación de integridad')
    }

    return decipher.output.toString()
  } catch (error) {
    console.error('Error al desencriptar:', error)
    throw new Error('Error al desencriptar los datos')
  }
}

// Referencia para almacenar el token
export const authToken = ref<string | null>(localStorage.getItem('auth_token'))
export const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []
const { showError, showSuccess } = useNotification()

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(authToken.value!)
    }
  })
  failedQueue = []
}

// Función para establecer los tokens de autorización
export const setAuthToken = (token: string, refreshTokenValue: string, rememberMe: boolean = true) => {
  authToken.value = token
  refreshToken.value = refreshTokenValue
  if (rememberMe) {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('refresh_token', refreshTokenValue)
  } else {
    sessionStorage.setItem('auth_token', token)
    sessionStorage.setItem('refresh_token', refreshTokenValue)
  }
}

// Función para obtener el refresh token
export const getRefreshToken = (): string | null => {
  if (!refreshToken.value) {
    const storedToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
    if (storedToken) {
      refreshToken.value = storedToken
    }
  }
  return refreshToken.value
}

// Función para obtener el token de autorización
export const getAuthToken = (): string | null => {
  if (!authToken.value) {
    const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (storedToken) {
      authToken.value = storedToken
    }
  }
  return authToken.value
}

// Función para refrescar el token
export const refreshAuthToken = async (): Promise<string> => {
  try {
    const currentRefreshToken = getRefreshToken()
    const currentAccessToken = getAuthToken()
    if (!currentRefreshToken) {
      showError('No hay token de refresco disponible', 'Error de Autenticación')
      throw new Error('No refresh token available')
    }

    const response = await fetch(getApiUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      showError(errorData.detail?.mensaje || '')
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    setAuthToken(data.result.token, data.result.refresh_token)
    showSuccess('Token refrescado exitosamente', 'Autenticación')
    processQueue()
    return data.result.token
  } catch (error) {
    processQueue(error)
    throw error
  }
}

// Función para manejar errores de token expirado
export const handleTokenExpired = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true
  try {
    const newToken = await refreshAuthToken()
    isRefreshing = false
    return newToken
  } catch (error) {
    isRefreshing = false
    clearAuthToken()
    throw error
  }
}

// Función para eliminar los tokens
export const clearAuthToken = () => {
  authToken.value = null
  refreshToken.value = null
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('refresh_token')
}

// Función para crear headers con autorización
export const getAuthHeaders = (contentType: string = 'application/json'): Headers => {
  const headers = new Headers({
    'Content-Type': contentType,
  })

  const token = getAuthToken()
  if (token) {
    headers.append('Authorization', `Bearer ${token}`)
  }

  return headers
}

interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

interface AuthResponse {
  token: string
  refresh_token: string
  user: User
}

export const useAuth = () => {
  const user = ref<AuthResponse['user'] | null>(null)
  const isAuthenticated = ref(!!getAuthToken())

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Encriptar credenciales antes de enviar
      const encryptedCredentials = {
        // username: encryptData(credentials.username),
        // password: encryptData(credentials.password),
        username: credentials.username,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      }

      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-Encrypted': 'true' // Header para indicar que los datos están encriptados
        },
        body: JSON.stringify(encryptedCredentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        showError(errorData.detail?.mensaje || '')
        return false
      }

      const data = await response.json()
      const result = data?.result as AuthResponse

      // Guardar ambos tokens
      setAuthToken(result.token, result.refresh_token, credentials.rememberMe)

      user.value = result.user
      isAuthenticated.value = true

      return true
    } catch (error) {
      console.error('Error durante el login:', error)
      return false
    }
  }

  const logout = () => {
    clearAuthToken()
    user.value = null
    isAuthenticated.value = false
  }

  const checkAuth = () => {
    const token = getAuthToken()
    isAuthenticated.value = !!token
    // Aquí podrías hacer una llamada a la API para validar el token
    // y obtener la información actualizada del usuario
  }

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth,
    getAuthToken,
    setAuthToken,
    clearAuthToken,
    getAuthHeaders
  }
}
