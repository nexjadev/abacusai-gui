<script setup lang="ts">
import SystemMessage from './Messages/SystemMessage.vue'
import UserMessage from './Messages/UserMessage.vue'
import AiMessage from './Messages/AiMessage.vue'
import { History } from '../services/apiAbacus2.ts'

type Props = {
  message: History
}

const { message } = defineProps<Props>()
</script>

<template>
  <!-- <SystemMessage v-if="message.role == 'system'" :message="message" /> -->
  <UserMessage v-if="message.role == 'USER'" :message="message" />
  <!-- <AiMessage v-if="message.role == 'assistant'" :message="message" /> -->
  <AiMessage v-if="message.role == 'BOT'" :message="message" />
</template>
