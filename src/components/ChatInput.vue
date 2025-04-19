<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTextareaAutosize } from '@vueuse/core'
import { useChats } from '../services/chat.ts'
import { showSystem } from '../services/appConfig.ts'
import { IconPlayerStopFilled, IconSend, IconWhirl } from '@tabler/icons-vue'
import { useApi } from '../services/api.ts'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })
const {
  addSystemMessage,
  addUserMessage,
  abort,
  uploadDataChat,
  activeChat,
  activeModel,
  filesUploaded,
  isWebSearchActive,
  forceRoutingAction,
  getOneDocumentUploaded,
  createNewChat,
  getAllDocumentsUploaded,
  attachDocuments,
} = useChats()

const { getDocumentDownloadUrl } = useApi()

const isSystemMessage = ref(false)
const isInputValid = computed<boolean>(() => !!userInput.value.trim())
const isAiResponding = ref(false)
const flag = ref(true)
const showAttachMenu = ref(false)
const selectedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileUrls = ref<Map<File, string>>(new Map())
const isUploadingFiles = ref(false)

const emit = defineEmits(['web-search-toggle'])

const onSubmit = async () => {
  if (isAiResponding.value) {
    abort()
    isAiResponding.value = false
    return
  }

  if (isInputValid.value) {
    if (isSystemMessage.value) {
      await addSystemMessage(userInput.value.trim())
    } else {
      if (!activeChat.value?.id) {
        await createNewChat()
      }
      isAiResponding.value = true
      await attachDocuments()
      addUserMessage(userInput.value.trim()).then(() => {
        flag.value = true
        isAiResponding.value = false
      })
      userInput.value = ''
      filesUploaded.value = []
      getAllDocumentsUploaded()
    }
    // if (!isSystemMessage.value) {
    //   isAiResponding.value = true
    // }
  }
}

const shouldSubmit = ({ key, shiftKey }: KeyboardEvent): boolean => {
  return key === 'Enter' && !shiftKey
}

const onKeydown = (event: KeyboardEvent) => {
  if (shouldSubmit(event)) {
    event.preventDefault()
  }
  if (shouldSubmit(event) && flag.value) {
    // Pressing enter while the ai is responding should not abort the request
    if (isAiResponding.value || isUploadingFiles.value) {
      return
    }
    flag.value = false
    onSubmit()
  }
}

const handleCompositionStart = () => {
  flag.value = false
}

const handleCompositionEnd = () => {
  flag.value = true
}

const handlePaste = async (event: ClipboardEvent) => {
  // Asegurarnos que flag.value sea true después de pegar texto
  flag.value = true

  // Verificar si hay archivos en el portapapeles
  if (event.clipboardData?.files.length) {
    const files = Array.from(event.clipboardData.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      // Si hay imágenes, procesarlas como archivos adjuntos
      isUploadingFiles.value = true

      for (const file of imageFiles) {
        try {
          const response = await uploadDataChat(activeModel.value?.id ?? '', activeChat.value?.id ?? '', file)
          const document = await getOneDocumentUploaded(response.id)
          if (document) {
            filesUploaded.value.push(document)
          }
        } catch (error) {
          console.error('Error al subir la imagen:', error)
          alert(`Error al subir la imagen ${file.name}`)
        }
      }

      isUploadingFiles.value = false
    }
  }
}

const toggleAttachMenu = () => {
  showAttachMenu.value = !showAttachMenu.value
}

const handleAddFromFiles = () => {
  // Implementar lógica para agregar desde archivos
  showAttachMenu.value = false
}

const handleUploadFromComputer = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
  showAttachMenu.value = false
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  const files = Array.from(input.files)
  const maxFiles = 5
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  if (files.length > maxFiles) {
    alert('No se pueden subir más de 5 archivos a la vez')
    return
  }

  const validFiles = files.filter((file) => {
    if (file.size > maxFileSize) {
      alert(`El archivo ${file.name} excede el tamaño máximo permitido de 10MB`)
      return false
    }
    return true
  })

  selectedFiles.value = validFiles
  isUploadingFiles.value = true

  // Subir cada archivo válido
  for (const file of validFiles) {
    try {
      const response = await uploadDataChat(activeModel.value?.id ?? '', activeChat.value?.id ?? '', file)
      const document = await getOneDocumentUploaded(response.id)
      if (document) {
        filesUploaded.value.push(document)
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error)
      alert(`Error al subir el archivo ${file.name}`)
    }
  }

  isUploadingFiles.value = false
  // Limpiar el input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const closeAttachMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.attach-menu-container')) {
    showAttachMenu.value = false
  }
}

const toggleWebSearch = () => {
  isWebSearchActive.value = !isWebSearchActive.value
  emit('web-search-toggle', isWebSearchActive.value)
}

onMounted(() => {
  document.addEventListener('click', closeAttachMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeAttachMenu)
  fileUrls.value.forEach((url) => URL.revokeObjectURL(url))
})

const isImage = (file: File): boolean => {
  return file.type.startsWith('image/')
}

</script>

<template>
  <form @submit.prevent="onSubmit" class="mx-auto w-full max-w-5xl">
    <input
      type="file"
      ref="fileInputRef"
      @change="handleFileSelect"
      multiple
      accept="*"
      class="hidden"
    />
    <div class="flex flex-row items-center px-2">
      <div class="attach-menu-container relative">
        <button
          type="button"
          @click="toggleAttachMenu"
          :disabled="isWebSearchActive"
          class="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-paperclip text-gray-900 dark:text-gray-100">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5"/>
          </svg>
        </button>

        <!-- Popup Menu -->
        <div
          v-if="showAttachMenu"
          class="absolute bottom-full left-0 z-50 mb-2 w-52 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800"
        >
          <div class="py-1">
            <!-- <button
              @click="handleAddFromFiles"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add from Files
            </button> -->
            <button
              @click="handleUploadFromComputer"
              class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg class="mr-2 h-5 w-5 text-gray-900 dark:text-gray-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload from computer
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        @click="toggleWebSearch"
        v-if="!forceRoutingAction"
        :disabled="showAttachMenu"
        :class="[
          'rounded-lg p-2 transition-colors duration-200',
          isWebSearchActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700',
          showAttachMenu ? 'cursor-not-allowed opacity-50' : '',
        ]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-world-www text-gray-900 dark:text-gray-100">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M19.5 7a9 9 0 0 0 -7.5 -4a8.991 8.991 0 0 0 -7.484 4" />
          <path d="M11.5 3a16.989 16.989 0 0 0 -1.826 4" />
          <path d="M12.5 3a16.989 16.989 0 0 1 1.828 4" />
          <path d="M19.5 17a9 9 0 0 1 -7.5 4a8.991 8.991 0 0 1 -7.484 -4" />
          <path d="M11.5 21a16.989 16.989 0 0 1 -1.826 -4" />
          <path d="M12.5 21a16.989 16.989 0 0 0 1.828 -4" />
          <path d="M2 10l1 4l1.5 -4l1.5 4l1 -4" />
          <path d="M17 10l1 4l1.5 -4l1.5 4l1 -4" />
          <path d="M9.5 10l1 4l1.5 -4l1.5 4l1 -4" />
        </svg>
      </button>
      <div v-if="isUploadingFiles" class="text-center px-2">
          <div role="status">
              <svg aria-hidden="true" class="inline w-7 h-7 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              <span class="sr-only">Loading...</span>
          </div>
      </div>
      <div class="flex h-12 w-full flex-wrap gap-0.5 overflow-y-auto px-[10px] pt-1">
        <div
          v-for="(file, index) in filesUploaded"
          :key="index"
          class="group relative flex h-10 min-w-24 cursor-default items-center rounded-lg border-[1px] border-gray-300 px-[5px] py-1 dark:border-gray-700 dark:bg-gray-800"
        >
          <div
            class="bg-darkcoloro border-darkcolor/[0.4] invisible absolute right-0 top-0 size-4 -translate-y-1/3 translate-x-1/3 cursor-pointer rounded border group-hover:visible"
            @click="
              filesUploaded.splice(index, 1)
            "
          >
            <div
              class="bg-darkcolor/[0.07] hover:bg-darkcolor/[0.4] absolute inset-0 flex items-center justify-center rounded"
            >
              <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" class="svg-inline--fa fa-xmark" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="transform-origin: 0.375em 0.5em">
                <g transform="translate(192 256)">
                  <g transform="translate(0, 0)  scale(0.8125, 0.8125)  rotate(0 0 0)">
                    <path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" transform="translate(-192 -256)"></path>
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <div class="flex !size-8 items-center justify-center rounded-lg bg-gray-500 text-white">
            <template v-if="file.file_type.startsWith('image/')">
              <img
                :src="file.file_path" alt="Image"
                style="width: 30px; height: 30px; border-radius: 8px"
              />
            </template>
            <template v-else>
              <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file" class="svg-inline--fa fa-file w-4 h-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                  <path fill="currentColor" d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"></path>
              </svg>
            </template>
          </div>
          <div class="ml-[8px] ms-[6px] min-w-0 flex-1">
            <p
              class="max-w-[190px] truncate text-ellipsis text-xs font-medium text-gray-900 dark:text-white"
            >
              {{ file.file_name }}
            </p>
            <p class="truncate text-xs text-gray-400 dark:text-gray-300">
              {{ file.file_type.split('/')[1].toUpperCase() }}
            </p>
          </div>
        </div>
      </div>
      <!-- <div
        class="mb-2 space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100"
        v-if="showSystem"
      >
        <label>
          <input type="radio" :value="false" v-model="isSystemMessage" />
          User
        </label>
        <label>
          <input type="radio" :value="true" v-model="isSystemMessage" />
          System
        </label>
      </div> -->
    </div>
    <div class="relative px-2">
      <textarea
        ref="textarea"
        v-model="userInput"
        class="block max-h-[500px] w-full resize-none rounded-xl border-none bg-gray-100 p-4 pl-4 pr-20 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-gray-50 dark:placeholder-gray-300 dark:focus:ring-blue-600 sm:text-base"
        placeholder="Enter your prompt"
        @keydown="onKeydown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @paste="handlePaste"
      ></textarea>
      <button
        type="submit"
        :disabled="(isInputValid == false && isAiResponding == false) || isUploadingFiles"
        class="group absolute bottom-2 right-4 flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 dark:disabled:bg-gray-600 sm:text-base"
      >
        <IconPlayerStopFilled
          v-if="isAiResponding"
          class="absolute opacity-0 transition duration-200 ease-in-out group-hover:opacity-100"
          :size="20"
        />
        <IconWhirl
          class="absolute animate-spin opacity-50 transition duration-200 ease-in-out group-hover:opacity-0"
          v-if="isAiResponding"
          :size="20"
        />

        <IconSend v-else :size="20" />
      </button>
    </div>
  </form>
</template>
