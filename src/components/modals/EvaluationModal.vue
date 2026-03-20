<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Rule, Student } from '@/types'
import { useAuth } from '@/composables/useAuth'

interface FrequentRule {
  name: string
  points: number
  category: string
  use_count: number
}

const props = defineProps<{
  show: boolean
  student: Student | null
  selectedCount: number
  rules: Rule[]
}>()

const emit = defineEmits<{
  close: []
  evaluate: [rule: Rule]
}>()

const { api } = useAuth()

const selectedTab = ref('学习')
const categories = ['学习', '行为', '健康', '其他', '常用']
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
  } catch (error) {
    console.error('加载常用规则失败:', error)
    frequentRules.value = []
  }
}

watch(() => props.show, (show) => {
  if (show) {
    selectedTab.value = '学习'
    loadFrequentRules()
  }
})

function evaluate(rule: Rule) {
  emit('evaluate', rule)
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">⭐</span>
          <template v-if="student">
            为 <span class="text-gradient">{{ student?.name }}</span> 评价
          </template>
          <template v-else>
            批量评价 <span class="text-purple-500">{{ selectedCount }}</span> 名学生
          </template>
        </h3>

        <!-- 分类标签 -->
        <div class="flex gap-2 mb-6 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedTab = cat"
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            :class="selectedTab === cat
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ cat }}
            <span v-if="cat === '常用' && frequentRules.length > 0" class="ml-1 text-xs opacity-75">({{ frequentRules.length }})</span>
          </button>
        </div>

        <!-- 常用规则空状态 -->
        <div v-if="selectedTab === '常用' && frequentRules.length === 0" class="text-center py-16 text-gray-500">
          <div class="text-5xl mb-4">📊</div>
          <p>暂无常用规则</p>
          <p class="text-sm mt-2 text-gray-400">使用评价后会自动记录常用规则</p>
        </div>

        <!-- 规则网格 -->
        <div v-else class="h-[590px] overflow-y-auto pr-2 custom-scrollbar">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
            <button
              v-for="rule in currentCategoryRules"
              :key="rule.id"
              @click="evaluate(rule)"
              class="rounded-2xl p-4 text-left transition-all border-2 hover:scale-105 hover:shadow-lg active:scale-95 h-[110px]"
              :class="rule.points > 0
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
                : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-400'"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="font-bold text-2xl"
                  :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                </span>
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="rule.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                >
                  {{ rule.points > 0 ? '加分' : '扣分' }}
                </span>
              </div>
              <div class="text-sm text-gray-700 font-medium leading-tight line-clamp-2">{{ rule.name }}</div>
            </button>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="close" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>