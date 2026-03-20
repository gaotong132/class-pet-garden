<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Rule } from '@/types'
import QuickEvalSection from '../QuickEvalSection.vue'

const props = defineProps<{
  show: boolean
  selectedCount: number
  rules: Rule[]
}>()

defineEmits<{
  close: []
  evaluate: [rule: Rule]
}>()

const quickEvalRef = ref<InstanceType<typeof QuickEvalSection> | null>(null)

watch(() => props.show, async (show) => {
  if (show) {
    quickEvalRef.value?.loadFrequentRules()
  }
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl animate-scale-in">
        <!-- 头部 -->
        <div class="relative bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-6 rounded-t-3xl">
          <div class="absolute top-4 right-4">
            <button @click="$emit('close')" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors" title="关闭">
              ×
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span class="text-3xl">👥</span>
            </div>
            <div class="text-white">
              <h3 class="text-2xl font-bold">批量评价</h3>
              <p class="text-white/80 text-sm">
                已选择 <span class="font-bold">{{ selectedCount }}</span> 名学生
              </p>
            </div>
          </div>
        </div>

        <!-- 快速评价（复用组件） -->
        <QuickEvalSection
          ref="quickEvalRef"
          :rules="rules"
          @evaluate="$emit('evaluate', $event)"
        />

        <!-- 底部 -->
        <div class="p-4 flex justify-end">
          <button @click="$emit('close')" class="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>