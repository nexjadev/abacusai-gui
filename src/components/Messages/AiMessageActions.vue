<script setup lang="ts">
import markdownit from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'
import { History } from '../../services/api.ts'
import { ref } from 'vue';
import { useConfig } from '../../services/appConfig.ts'
import { useChats } from '../../services/chat.ts'

const { messages, editUserMessage } = useChats()
const { getRoutingDictionary, getImageDictionary } = useConfig()

type Props = {
    message: History
}

const { message } = defineProps<Props>()

const showCopiedMessage = ref(false)
const showCopyOptions = ref(false)

const copyToClipboard = async (type: 'raw' | 'rendered') => {
    let text = ''

    if (type === 'raw') {
        // Copiar texto sin formato
        text = message.segments
            .filter(content => content.type === 'text' && !content.temp)
            .map(content => content.segment)
            .join('\n')
    } else {
        // Copiar texto con formato HTML renderizado
        const markdownContent = message.segments
            .filter(content => content.type === 'text' && !content.temp)
            .map(content => content.segment)
            .join('\n')

        // Configuramos markdown-it para renderizar el contenido
        const md = markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true,
        }).use(highlightjs, {
            inline: false,
            auto: true,
            code: true,
            ignoreIllegals: true,
        })

        // Renderizamos el markdown a HTML
        const renderedHtml = md.render(markdownContent)

        // Extraemos el texto plano del HTML renderizado
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = renderedHtml
        text = tempDiv.textContent || ''
    }

    try {
        await navigator.clipboard.writeText(text)
        showCopiedMessage.value = true
        showCopyOptions.value = false
        setTimeout(() => {
            showCopiedMessage.value = false
        }, 2000)
    } catch (error) {
        console.error('Error al copiar el texto:', error)
    }
}

const toggleCopyOptions = () => {
    showCopyOptions.value = !showCopyOptions.value
}

// Cerrar el popup cuando se hace clic fuera de él
const closeCopyOptions = () => {
    showCopyOptions.value = false
}

const regenerateResponse = async () => {
    // Buscamos el último mensaje con rol "USER" en la lista de mensajes
    const lastUserMessage = [...messages.value]
        .reverse()
        .find(msg => msg.role === "USER");

    if (lastUserMessage && lastUserMessage.text) {
        await editUserMessage(lastUserMessage.text);
    }
}
</script>
<template>
    <!-- Botones de opciones al final del mensaje -->
    <div class="flex items-center justify-end gap-2 mt-4">
        <!-- Mensaje de copiado -->
        <span v-if="showCopiedMessage" class="text-xs text-green-600 dark:text-green-400 mr-2">
            ¡Copiado al portapapeles!
        </span>

        <!-- Botón de pulgar arriba -->
        <button
            v-if="false"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Me gusta esta respuesta">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 10v12" />
                <path
                    d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
            </svg>
        </button>

        <!-- Botón de copiar con menú desplegable -->
        <div class="relative">
            <button @click="toggleCopyOptions"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Copiar respuesta">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
            </button>

            <!-- Menú desplegable -->
            <div v-if="showCopyOptions"
                class="absolute right-0 bottom-10 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-2 min-w-60 z-10 border border-gray-200 dark:border-gray-600">
                <button @click="copyToClipboard('raw')"
                    class="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy raw response
                </button>
                <button @click="copyToClipboard('rendered')"
                    class="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Copy rendered response
                </button>
            </div>
        </div>

        <!-- Botón de regenerar -->
        <button @click="regenerateResponse"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Regenerar respuesta">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
            </svg>
        </button>
    </div>

    <!-- Capa transparente para cerrar el popup cuando se hace clic fuera -->
    <div v-if="showCopyOptions" @click="closeCopyOptions" class="fixed inset-0 z-0"></div>
</template>
