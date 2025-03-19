import { Directive, DirectiveBinding, nextTick } from 'vue'

interface CodeCopyButtonOptions {
  selector?: string
  buttonClass?: string
  successDuration?: number
}

const defaultOptions: CodeCopyButtonOptions = {
  selector: '[data-copy-target="true"]',
  buttonClass: 'copy-button',
  successDuration: 2000
}

// Función para crear un botón de copiar
const createCopyButton = (
  text: string,
  options: CodeCopyButtonOptions = {}
): HTMLButtonElement => {
  const mergedOptions = { ...defaultOptions, ...options }

  const button = document.createElement('button')
  button.className = `${mergedOptions.buttonClass} absolute top-2 right-2 p-1 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white transition-colors text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>'
  button.title = 'Copiar código'
  button.setAttribute('aria-label', 'Copiar código al portapapeles')

  button.addEventListener('click', (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visual al usuario
      const originalHTML = button.innerHTML
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
      button.classList.add('bg-green-700')

      setTimeout(() => {
        button.innerHTML = originalHTML
        button.classList.remove('bg-green-700')
      }, mergedOptions.successDuration!)
    }).catch(error => {
      console.error('Error al copiar al portapapeles:', error)
    })
  })

  return button
}

// Añadir botones a los elementos que correspondan al selector
const addCopyButtons = (el: HTMLElement, options: CodeCopyButtonOptions = {}): void => {
  const mergedOptions = { ...defaultOptions, ...options }

  // Buscar elementos objetivo dentro del contenedor
  const targetElements = el.querySelectorAll(mergedOptions.selector!)

  targetElements.forEach(target => {
    // Verificar si ya tiene un botón de copiar
    if (target.getAttribute('data-copy-processed') === 'true') {
      return
    }

    // Marcar como procesado
    target.setAttribute('data-copy-processed', 'true')

    // Obtener el código a copiar (normalmente está en un elemento code dentro del pre)
    const codeElement = target.querySelector('code')
    if (!codeElement) return

    const textToCopy = codeElement.textContent || ''

    // Crear el botón de copiar
    const copyButton = createCopyButton(textToCopy, options)

    // Añadir el botón al contenedor apropiado
    if (target.parentElement?.classList.contains('relative')) {
      // Si ya está en un contenedor relativo, añadir directamente
      target.parentElement.appendChild(copyButton)
    } else {
      // Crear un contenedor relativo y envolver el target
      const container = document.createElement('div')
      container.className = 'relative'

      // Reemplazar el target con el contenedor
      target.parentElement?.insertBefore(container, target)
      container.appendChild(target)
      container.appendChild(copyButton)
    }
  })
}

// Directiva Vue que añade botones de copiar a los bloques de código
export const vCopyCode: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    nextTick(() => {
      addCopyButtons(el, binding.value || {})
    })
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    nextTick(() => {
      addCopyButtons(el, binding.value || {})
    })
  }
}

// Función para usar de forma programática
export const addCopyButtonsToElement = addCopyButtons
