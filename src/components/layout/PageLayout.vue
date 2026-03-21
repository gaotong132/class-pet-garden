<script setup lang="ts">
import { onActivated } from 'vue'
import { useClasses } from '@/composables/useClasses'
import Header from './Header.vue'

defineProps<{
  contentClass?: string
}>()

const { syncCurrentClass } = useClasses()

// 自动同步班级状态
onActivated(() => {
  syncCurrentClass()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col">
    <Header />

    <main class="flex-1 p-6" :class="contentClass">
      <slot />
    </main>
  </div>
</template>