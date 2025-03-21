<template>
  <div class="flex items-center justify-center w-full min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
    <div class="bg-white p-8 rounded-lg shadow-lg w-96 relative">

      <!-- Título -->
      <h2 class="text-2xl font-semibold mb-6 text-center">Login</h2>

      <!-- Formulario -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Campo de Username -->
        <div>
          <div class="relative">
            <input
              type="text"
              v-model="username"
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your username"
              :class="{ 'border-red-500': errors.username }"
            />
            <p v-if="errors.username" class="text-red-500 text-sm mt-1">{{ errors.username }}</p>
          </div>
        </div>

        <!-- Campo de contraseña -->
        <div>
          <div class="relative">
            <input
              type="password"
              v-model="password"
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
              :class="{ 'border-red-500': errors.password }"
            />
            <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
          </div>
        </div>

        <!-- Remember me y Forgot password -->
        <div class="flex items-center justify-between">
          <label class="flex items-center">
            <input type="checkbox" v-model="rememberMe" class="form-checkbox text-purple-600" />
            <span class="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <a href="#" class="text-sm text-purple-600 hover:text-purple-800">Forgot password?</a>
        </div>

        <!-- Error general -->
        <div v-if="errors.general" class="text-red-500 text-sm text-center">
          {{ errors.general }}
        </div>

        <!-- Botón de Login -->
        <button
          type="submit"
          class="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Cargando...</span>
          <span v-else>Login Now</span>
        </button>

        <!-- Signup link -->
        <!-- <div class="text-center text-sm text-gray-600">
          Not a member?
          <a href="#" class="text-purple-600 hover:text-purple-800">Signup Now</a>
        </div> -->
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuth } from '../services/auth'

const emit = defineEmits<{
  (e: 'login-success'): void
}>()

const { login } = useAuth()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errors = reactive({
  username: '',
  password: '',
  general: ''
})

const validateForm = (): boolean => {
  let isValid = true
  errors.username = ''
  errors.password = ''
  errors.general = ''

  if (!username.value.trim()) {
    errors.username = 'El nombre de usuario es requerido'
    isValid = false
  }

  if (!password.value.trim()) {
    errors.password = 'La contraseña es requerida'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    isLoading.value = true
    const success = await login({
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    if (success) {
      emit('login-success')
    } else {
      errors.general = 'Credenciales inválidas'
    }
  } catch (error) {
    errors.general = 'Error al intentar iniciar sesión'
    console.error('Error en login:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
