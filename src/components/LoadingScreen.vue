<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center z-[200]">
      <div class="text-center">
        <div class="text-8xl mb-6 animate-bounce">🐕</div>
        <div class="text-xl font-bold text-gray-600">加载中...</div>
        <div class="mt-4 flex justify-center gap-2">
          <span class="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>
    </div>
  </Transition>
</template>