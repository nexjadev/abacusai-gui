<script setup lang="ts">
// import SystemMessage from './Messages/SystemMessage.vue'
import UserMessage from './Messages/UserMessage.vue'
import AiMessage from './Messages/AiMessage.vue'
import { Message } from '../dtos/message.dto.ts'

type Props = {
  message: Message
}

const { message } = defineProps<Props>()
const emit = defineEmits(['updateMessage'])

const handleMessageUpdate = (updatedMessage: any) => {
  emit('updateMessage', updatedMessage)
}
</script>

<template>
  <!-- <SystemMessage v-if="message.role == 'system'" :message="message" /> -->
  <UserMessage v-if="message.role == 'user'" :message="message" @update-message="handleMessageUpdate"/>
  <AiMessage v-if="message.role == 'assistant'" :message="message" />
</template>
