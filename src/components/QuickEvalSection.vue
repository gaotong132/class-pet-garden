<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Rule } from '@/types'
import { useAuth } from '@/composables/useAuth'

interface FrequentRule {
  name: string
  points: number
  category: string
  use_count: number
}

const props = defineProps<{
  rules: Rule[]
}>()

const emit = defineEmits<{
  evaluate: [rule: Rule]
}>()

const { api } = useAuth()

const selectedTab = ref('常用')
const categories = ['常用', '学习', '行为', '健康', '其他']
const frequentRules = ref<FrequentRule[]>([])

const currentCategoryRules = computed(() => {
  if (selectedTab.value === '常用') {
    return frequentRules.value.map(r => ({
      id: `freq-${r.name}-${r.points}`,
      name: r.name,
      points: r.points,
      category: r.category
    }))
  }
  return props.rules.filter(r => r.category === selectedTab.value)
})

async function loadFrequentRules() {
  try {
    const res = await api.get('/rules/frequent')
    frequentRules.value = res.data.rules || []
    if (frequentRules.value.length > 0) {
      selectedTab.value = '常用'
    } else {
      selectedTab.value = '学习'
    }
  } catch (error) {
    console.error('加载常用规则失败:', error)
    frequentRules.value = []
    selectedTab.value = '学习'
  }
}

function handleEvaluate(rule: Rule) {
  emit('evaluate', rule)
}

// 暴露方法供父组件调用
defineExpose({
  loadFrequentRules
})

// 监听 rules 变化
watch(() => props.rules, () => {
  // rules 变化时重新加载常用规则
}, { immediate: true })
</script>

<template>
  <div class="p-6 border-b border-gray-100">
    <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
      <span>⚡</span> 快速评价
    </h4>
    <!-- 分类标签 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedTab = cat"
        class="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
        :class="selectedTab === cat
          ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >
        {{ cat }}
        <span v-if="cat === '常用' && frequentRules.length > 0" class="ml-1 text-xs opacity-75">({{ frequentRules.length }})</span>
      </button>
    </div>
    <!-- 规则按钮 -->
    <div class="h-[400px] overflow-y-auto pr-1 custom-scrollbar">
      <!-- 常用规则空状态 -->
      <div v-if="selectedTab === '常用' && frequentRules.length === 0" class="text-center py-16 text-gray-500">
        <div class="text-4xl mb-3">📊</div>
        <p>暂无常用规则</p>
        <p class="text-xs mt-1 text-gray-400">使用评价后会自动记录</p>
      </div>
      <div v-else class="grid grid-cols-5 gap-2 content-start">
        <button
          v-for="rule in currentCategoryRules"
          :key="rule.id"
          @click="handleEvaluate(rule)"
          class="rounded-xl p-2 text-center transition-all border-2 hover:scale-105 active:scale-95 h-[70px]"
          :class="rule.points > 0
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
            : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-400'"
        >
          <div
            class="text-base font-bold"
            :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
          >
            {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
          </div>
          <div class="text-xs text-gray-600 leading-tight line-clamp-2">{{ rule.name }}</div>
        </button>
      </div>
    </div>
  </div>
</template>