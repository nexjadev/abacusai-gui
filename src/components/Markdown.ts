import { Component, computed, defineComponent, h, onMounted, ref, nextTick } from 'vue'
import highlightjs from 'markdown-it-highlightjs'
import markdownit from 'markdown-it'
import { markdownItCopy, addCopyButtonsToElement } from '../plugins/markdown-copy'

const Markdown: Component = defineComponent({
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const md = ref<markdownit>(
      markdownit({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
      })
    )

    // Aplicar los plugins
    md.value.use(highlightjs, {
      inline: false,
      auto: true,
      code: true,
      ignoreIllegals: true,
    })

    // Añadir nuestro plugin personalizado para los botones de copiar
    md.value.use(markdownItCopy)

    const content = computed(() => md.value.render(props.source))
    const markdownContainer = ref<HTMLElement | null>(null)
    const contentRendered = ref(false)

    // Añadir botones de copiar al contenido después de que se haya renderizado
    const applyButtonsToContent = () => {
      if (markdownContainer.value && !contentRendered.value) {
        addCopyButtonsToElement(markdownContainer.value)
        contentRendered.value = true
      }
    }

    // Observar cambios en la propiedad source
    const resetContentState = () => {
      contentRendered.value = false
    }

    // Este computed se ejecutará cada vez que cambie props.source
    const sourceWatcher = computed(() => {
      resetContentState()
      return props.source
    })

    onMounted(() => {
      nextTick(() => {
        applyButtonsToContent()
      })
    })

    // Generar un ID único para este componente
    const uniqueId = `markdown-${Date.now().toString(36)}`

    return () => {
      // Capturar el valor actual para provocar una reacción al cambio
      sourceWatcher.value

      return h('div', {
        innerHTML: content.value,
        'data-markdown-id': uniqueId,
        ref: el => {
          markdownContainer.value = el as HTMLElement
          if (el) {
            nextTick(applyButtonsToContent)
          }
        }
      })
    }
  },
})

export default Markdown
