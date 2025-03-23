import { ref } from 'vue'
import { getApiUrl } from './appConfig'

// Referencia para almacenar el token
export const authToken = ref<string | null>(localStorage.getItem('auth_token'))
export const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

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
    if (!currentRefreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(getApiUrl('/users/refresh-token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    setAuthToken(data.access_token, data.refresh_token)
    processQueue()
    return data.access_token
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
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: string
    username: string
    // Agrega más campos según necesites
  }
}

export const useAuth = () => {
  const user = ref<AuthResponse['user'] | null>(null)
  const isAuthenticated = ref(!!getAuthToken())

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/users/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })
      const data: AuthResponse = await response.json()

      // Guardar ambos tokens
      setAuthToken(data.access_token, data.refresh_token, credentials.rememberMe)

      user.value = data.user
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
