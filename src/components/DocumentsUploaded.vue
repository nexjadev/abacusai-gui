<script setup lang="ts">
import { computed } from 'vue'
import { useChats } from '../services/chat.ts'
import { useApi } from '../services/api.ts'

const { documentsUploaded, detachDocuments } = useChats()
const { getDocumentDownloadUrl } = useApi()

const documents = computed(() => { return documentsUploaded?.value })
</script>

<template>
    <div class="flex flex-wrap max-w-5xl mx-auto px-2 py-6 sm:px-4">
        <div v-for="(file, index) in documents" :key="index"
            class="h-10 group cursor-default flex items-center border-gray-300 border-[1px] rounded-lg px-[5px] py-1 m-1 min-w-24 dark:bg-gray-800 dark:border-gray-700 relative">
            <div
                class="-translate-y-1/3 translate-x-1/3 invisible group-hover:visible absolute right-0 top-0 size-4 rounded bg-darkcoloro border border-darkcolor/[0.4] cursor-pointer">
                <div
                    class="absolute inset-0 flex items-center justify-center bg-darkcolor/[0.07] rounded hover:bg-darkcolor/[0.4]"
                    @click="detachDocuments(file.document_upload_id)">
                    <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark"
                        class="svg-inline--fa fa-xmark" role="img" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 384 512" style="transform-origin: 0.375em 0.5em;">
                        <g transform="translate(192 256)">
                            <g transform="translate(0, 0)  scale(0.8125, 0.8125)  rotate(0 0 0)">
                                <path fill="currentColor"
                                    d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
                                    transform="translate(-192 -256)"></path>
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="flex !size-8 bg-gray-500 rounded-lg items-center justify-center text-white">
                <img :src="getDocumentDownloadUrl(file.doc_id)"
                         alt="Close"
                         class="h-full" />
            </div>
            <div class="flex-1 min-w-0 ms-[6px] ml-[8px]">
                <p class="text-xs font-medium text-gray-900 truncate dark:text-white max-w-[190px] text-ellipsis">
                    {{ file.filename }}</p>
                <p class="text-xs text-gray-400 truncate dark:text-gray-300">{{
                    file.mime_type.split('/')[1].toUpperCase() }}</p>
            </div>
        </div>
    </div>
</template>
