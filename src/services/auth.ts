import { ref } from 'vue'

interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    // Agrega más campos según necesites
  }
}

export const useAuth = () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<AuthResponse['user'] | null>(null)
  const isAuthenticated = ref(!!token.value)

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      // Aquí realizarías la llamada a tu API
      // const response = await fetch('tu-api/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(credentials),
      // })
      // const data: AuthResponse = await response.json()

      // Simulación de respuesta exitosa (reemplazar con tu lógica real)
      const data: AuthResponse = {
        token: 'mock-token',
        user: {
          id: '1',
          username: credentials.username
        }
      }

      // Guardar el token y la información del usuario
      if (credentials.rememberMe) {
        localStorage.setItem('auth_token', data.token)
      } else {
        sessionStorage.setItem('auth_token', data.token)
      }

      token.value = data.token
      user.value = data.user
      isAuthenticated.value = true

      return true
    } catch (error) {
      console.error('Error durante el login:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    token.value = null
    user.value = null
    isAuthenticated.value = false
  }

  const checkAuth = () => {
    const storedToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (storedToken) {
      token.value = storedToken
      isAuthenticated.value = true
      // Aquí podrías hacer una llamada a la API para validar el token
      // y obtener la información actualizada del usuario
    }
  }

  return {
    isAuthenticated,
    user,
    login,
    logout,
    checkAuth
  }
}
