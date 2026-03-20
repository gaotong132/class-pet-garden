<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Student, Rule, EvaluationRecord } from '@/types'
import { getPetType, getLevelProgress, getPetLevelImage, calculateLevel } from '@/data/pets'
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
  rules: Rule[]
  studentRecords: EvaluationRecord[]
}>()

defineEmits<{
  close: []
  changePet: []
  evaluate: [rule: Rule]
}>()

const { api } = useAuth()

const detailEvalTab = ref('常用')
const categories = ['常用', '学习', '行为', '健康', '其他']
const frequentRules = ref<FrequentRule[]>([])

const currentCategoryRules = computed(() => {
  if (detailEvalTab.value === '常用') {
    return frequentRules.value.map(r => ({
      id: `freq-${r.name}-${r.points}`,
      name: r.name,
      points: r.points,
      category: r.category
    }))
  }
  return props.rules.filter(r => r.category === detailEvalTab.value)
})

async function loadFrequentRules() {
  try {
    const res = await api.get('/rules/frequent')
    frequentRules.value = res.data.rules || []
    if (frequentRules.value.length > 0) {
      detailEvalTab.value = '常用'
    } else {
      detailEvalTab.value = '学习'
    }
  } catch (error) {
    console.error('加载常用规则失败:', error)
    frequentRules.value = []
    detailEvalTab.value = '学习'
  }
}

function getDisplayLevel(student: Student): number {
  return calculateLevel(student.pet_exp)
}

function getStudentPetImage(student: Student): string {
  if (!student.pet_type) return ''
  return getPetLevelImage(student.pet_type, student.pet_level)
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

watch(() => props.show, async (show) => {
  if (show) {
    await loadFrequentRules()
  }
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show && student" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl animate-scale-in">
        <!-- 头部 -->
        <div class="relative bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-6 rounded-t-3xl">
          <!-- 顶部操作按钮 -->
          <div class="absolute top-4 right-4 flex gap-2">
            <button @click="$emit('changePet')" class="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full flex items-center gap-1.5 text-white text-sm transition-colors" title="更换宠物">
              <span>🐾</span>
              <span class="font-medium">换宠物</span>
            </button>
            <button @click="$emit('close')" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors" title="关闭">
              ×
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <img
                v-if="student.pet_type"
                :src="getStudentPetImage(student)"
                class="w-16 h-16 object-contain"
              />
              <span v-else class="text-4xl">❓</span>
            </div>
            <div class="text-white">
              <h3 class="text-2xl font-bold">{{ student.name }}</h3>
              <p class="text-white/80 text-sm">
                {{ student.pet_type ? getPetType(student.pet_type)?.name : '未领养' }}
                · Lv.{{ getDisplayLevel(student) }}
                · ⭐ {{ student.total_points }}
              </p>
            </div>
          </div>
          <!-- 进度条 -->
          <div class="mt-4">
            <div class="flex justify-between text-white/90 text-sm mb-1">
              <span>成长值</span>
              <span v-if="getLevelProgress(student.pet_exp).isMaxLevel" class="flex items-center gap-1">
                <span class="text-yellow-300 font-medium">🏆 已毕业，获得专属徽章</span>
              </span>
              <span v-else>
                {{ getLevelProgress(student.pet_exp).current }}/{{ getLevelProgress(student.pet_exp).required }}
              </span>
            </div>
            <div class="bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300"
                :style="{ width: `${getLevelProgress(student.pet_exp).percentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 快速评分 -->
        <div class="p-6 border-b border-gray-100">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>⚡</span> 快速评价
          </h4>
          <!-- 分类标签 -->
          <div class="flex gap-2 mb-4 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="detailEvalTab = cat"
              class="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
              :class="detailEvalTab === cat
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
            <div v-if="detailEvalTab === '常用' && frequentRules.length === 0" class="text-center py-16 text-gray-500">
              <div class="text-4xl mb-3">📊</div>
              <p>暂无常用规则</p>
              <p class="text-xs mt-1 text-gray-400">使用评价后会自动记录</p>
            </div>
            <div v-else class="grid grid-cols-5 gap-2 content-start">
              <button
                v-for="rule in currentCategoryRules"
                :key="rule.id"
                @click="$emit('evaluate', rule)"
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

        <!-- 最近记录 -->
        <div class="p-6">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span> 最近记录
          </h4>
          <div v-if="studentRecords.length === 0" class="text-center py-8 text-gray-400">
            <div class="text-4xl mb-2">📝</div>
            暂无评价记录
          </div>
          <div v-else class="space-y-2 max-h-60 overflow-auto">
            <div
              v-for="record in studentRecords"
              :key="record.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                :class="record.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-800">{{ record.reason }}</div>
                <div class="text-xs text-gray-400">
                  <span class="px-1.5 py-0.5 bg-gray-200 rounded mr-2">{{ record.category }}</span>
                  {{ formatDate(record.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>