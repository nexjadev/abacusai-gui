import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { useDarkMode } from './composables/useDarkMode'

// Inicializar el tema oscuro
useDarkMode()

createApp(App).mount('#app')
