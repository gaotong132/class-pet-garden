<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import type { EvaluationRecord, Class } from '@/types'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Header from '@/components/layout/Header.vue'

const { api, isGuest, username } = useAuth()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()

const classes = ref<Class[]>([])
const currentClass = ref<Class | null>(null)
const records = ref<EvaluationRecord[]>([])
const isLoading = ref(true)

// 分页
const page = ref(1)
const pageSize = 30
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize))

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadClasses() {
  try {
    const res = await api.get('/classes')
    classes.value = res.data.classes
    if (classes.value.length > 0) {
      const savedClassId = localStorage.getItem('pet-garden-current-class')
      currentClass.value = savedClassId 
        ? classes.value.find(c => c.id === savedClassId) || classes.value[0]
        : classes.value[0]
    }
  } catch (error) {
    console.error('加载班级失败:', error)
  }
}

async function loadRecords() {
  if (!currentClass.value) return
  isLoading.value = true
  try {
    const res = await api.get(`/evaluations?classId=${currentClass.value.id}&page=${page.value}&pageSize=${pageSize}`)
    records.value = res.data.records
    totalRecords.value = res.data.total
  } catch (error) {
    console.error('加载记录失败:', error)
  } finally {
    isLoading.value = false
  }
}

async function undoRecord(recordId?: string) {
  showConfirm({
    title: '撤回评价',
    message: '确定撤回该评价？将恢复学生的积分。',
    confirmText: '撤回',
    type: 'warning',
    onConfirm: async () => {
      try {
        await api.delete(`/evaluations/${recordId || records.value[0]?.id}`)
        toast.success('已撤回')
        loadRecords()
      } catch (error) {
        toast.error('撤回失败')
      }
    }
  })
}

// 检查班级是否变化
function syncCurrentClass() {
  const savedClassId = localStorage.getItem('pet-garden-current-class')
  if (savedClassId && savedClassId !== currentClass.value?.id) {
    currentClass.value = classes.value.find(c => c.id === savedClassId) || classes.value[0]
    page.value = 1
    loadRecords()
  }
}

onMounted(async () => {
  await loadClasses()
  await loadRecords()
})

onActivated(() => {
  syncCurrentClass()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col">
    <Header 
      :classes="classes" 
      :current-class="currentClass" 
      :is-guest="isGuest"
      :username="username"
      :batch-mode="false"
    />

    <main class="flex-1 p-6">
      <div class="max-w-4xl mx-auto">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span class="text-3xl">📋</span> 评价记录
            </h1>
            <p class="text-gray-500 text-sm mt-1" v-if="totalRecords > 0">
              共 {{ totalRecords }} 条记录
            </p>
          </div>
          <button
            v-if="records.length > 0"
            @click="undoRecord()"
            class="px-4 py-2 text-sm text-orange-500 hover:bg-orange-50 border border-orange-200 rounded-xl font-medium transition-colors flex items-center gap-1"
          >
            ↩️ 撤回最新
          </button>
        </div>

        <!-- 加载中 -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="text-6xl animate-bounce mb-4">📋</div>
            <div class="text-gray-500">加载中...</div>
          </div>
        </div>

        <!-- 无记录 -->
        <div v-else-if="records.length === 0" class="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm">
          <div class="text-6xl mb-4">📝</div>
          <div>暂无评价记录</div>
        </div>

        <!-- 记录列表 -->
        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="record in records"
              :key="record.id"
              class="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <!-- 头部 -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white flex items-center justify-center text-sm font-bold">
                    {{ record.student_name?.charAt(0) || '?' }}
                  </span>
                  <span class="font-bold text-gray-800">{{ record.student_name }}</span>
                </div>
                <span
                  class="px-3 py-1 rounded-full text-sm font-bold"
                  :class="record.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                >
                  {{ record.points > 0 ? '+' : '' }}{{ record.points }}
                </span>
              </div>

              <!-- 原因 -->
              <div class="text-sm text-gray-600 mb-3 line-clamp-2">
                {{ record.reason }}
              </div>

              <!-- 底部 -->
              <div class="flex items-center justify-between text-xs text-gray-400">
                <span class="px-2 py-1 bg-gray-100 rounded-lg">{{ record.category }}</span>
                <div class="flex items-center gap-2">
                  <span>{{ formatDate(record.timestamp) }}</span>
                  <button
                    @click="undoRecord(record.id)"
                    class="text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                  >
                    撤回
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
            <button
              @click="page--; loadRecords()"
              :disabled="page === 1"
              class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <div class="flex items-center gap-1">
              <button
                v-for="p in Math.min(5, totalPages)"
                :key="p"
                @click="page = p; loadRecords()"
                class="w-10 h-10 rounded-xl text-sm font-medium transition-colors"
                :class="page === p ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'"
              >
                {{ p }}
              </button>
              <span v-if="totalPages > 5" class="px-2 text-gray-400">...</span>
              <button
                v-if="totalPages > 5"
                @click="page = totalPages; loadRecords()"
                class="w-10 h-10 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100"
              >
                {{ totalPages }}
              </button>
            </div>
            <button
              @click="page++; loadRecords()"
              :disabled="page === totalPages"
              class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </template>
      </div>
    </main>

    <ConfirmDialog 
      :show="confirmDialog.show" 
      :title="confirmDialog.title" 
      :message="confirmDialog.message" 
      :confirm-text="confirmDialog.confirmText" 
      :cancel-text="confirmDialog.cancelText" 
      :type="confirmDialog.type" 
      @confirm="confirmDialog.onConfirm" 
      @cancel="closeConfirm" 
    />
  </div>
</template>