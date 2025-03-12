import { Component, computed, defineComponent, h, ref } from 'vue'
import highlightjs from 'markdown-it-highlightjs'
import markdownit from 'markdown-it'

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

    md.value.use(highlightjs, {
      inline: false,
      auto: true,
      code: true,
      ignoreIllegals: true,
    })

    const content = computed(() => md.value.render(props.source))

    return () => h('div', { innerHTML: content.value })
  },
})

export default Markdown
