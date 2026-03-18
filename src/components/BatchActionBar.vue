<script setup lang="ts">
defineProps<{
  selectedCount: number
  mode: 'batch' | 'delete'
}>()

defineEmits<{
  addPoints: []
  subPoints: []
  confirmDelete: []
  cancel: []
}>()
</script>

<template>
  <!-- 批量操作栏 -->
  <Transition name="slide-up">
    <div v-if="mode === 'batch' && selectedCount > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 flex gap-4 z-40 border border-gray-100">
      <button
        @click="$emit('addPoints')"
        class="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <span class="text-xl">⬆️</span> 统一加分
      </button>
      <button
        @click="$emit('subPoints')"
        class="bg-gradient-to-r from-red-400 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <span class="text-xl">⬇️</span> 统一扣分
      </button>
    </div>
  </Transition>

  <!-- 删除学生操作栏 -->
  <Transition name="slide-up">
    <div v-if="mode === 'delete'" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 flex gap-4 z-40 border border-gray-100">
      <span class="text-gray-600 py-3 font-medium">已选 <span class="text-red-500 font-bold">{{ selectedCount }}</span> 人</span>
      <button
        @click="$emit('confirmDelete')"
        :disabled="selectedCount === 0"
        class="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
      >
        <span class="text-xl">🗑️</span> 确认删除
      </button>
      <button
        @click="$emit('cancel')"
        class="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
      >
        取消
      </button>
    </div>
  </Transition>
</template>