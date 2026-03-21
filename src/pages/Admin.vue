<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import PageLayout from '@/components/layout/PageLayout.vue'

const { isAdmin, isGuest, api } = useAuth()
const toast = useToast()
const router = useRouter()

interface TeacherClass { id: string; name: string; student_count: number; eval_count: number }
interface Teacher { id: string; username: string; isAdmin: boolean; createdAt: number; classCount: number; totalStudents: number; totalEvals: number; classes: TeacherClass[] }
interface Stats { teachers: number; classes: number; students: number; evaluations: number; todayEvaluations: number }
interface DailyStat { date: string; newUsers: number; newClasses: number; newStudents: number; evaluations: number }

const teachers = ref<Teacher[]>([])
const stats = ref<Stats | null>(null)
const dailyStats = ref<DailyStat[]>([])
const isLoading = ref(true)
const expandedTeacher = ref<string | null>(null)
const activeTab = ref<'teachers' | 'stats'>('teachers')

onMounted(async () => {
  if (isGuest.value || !isAdmin.value) { toast.error('需要管理员权限'); router.push('/'); return }
  await loadData()
})

async function loadData() {
  isLoading.value = true
  try {
    const [teachersRes, statsRes] = await Promise.all([
      api.get('/admin/teachers'),
      api.get('/admin/stats')
    ])
    teachers.value = teachersRes.data.teachers
    stats.value = statsRes.data.stats
    // 兼容旧接口格式
    dailyStats.value = (statsRes.data.dailyStats || []).map((d: any) => ({
      date: d.date,
      newUsers: 0,
      newClasses: 0,
      newStudents: 0,
      evaluations: d.count
    }))
  } catch (e: any) {
    toast.error(e.response?.data?.error || '加载失败')
  } finally {
    isLoading.value = false
  }
}

async function loadDailyStats() {
  try {
    const res = await api.get('/admin/daily-stats')
    dailyStats.value = res.data.dailyStats
  } catch (e: any) {
    toast.error('加载统计数据失败')
  }
}

function toggleTeacher(id: string) { expandedTeacher.value = expandedTeacher.value === id ? null : id }
function formatDate(timestamp: number) { return new Date(timestamp).toLocaleDateString('zh-CN') }
function formatShortDate(date: string) { return date.slice(5) }

const totalStudents = computed(() => teachers.value.reduce((sum, t) => sum + t.totalStudents, 0))
const totalEvals = computed(() => teachers.value.reduce((sum, t) => sum + t.totalEvals, 0))

// 计算最大值用于图表高度
const maxEvals = computed(() => Math.max(...dailyStats.value.map(d => d.evaluations), 1))
const maxNewStudents = computed(() => Math.max(...dailyStats.value.map(d => d.newStudents), 1))
const maxNewUsers = computed(() => Math.max(...dailyStats.value.map(d => d.newUsers), 1))
const maxNewClasses = computed(() => Math.max(...dailyStats.value.map(d => d.newClasses), 1))

// 周汇总
const weekTotal = computed(() => ({
  newUsers: dailyStats.value.reduce((sum, d) => sum + d.newUsers, 0),
  newClasses: dailyStats.value.reduce((sum, d) => sum + d.newClasses, 0),
  newStudents: dailyStats.value.reduce((sum, d) => sum + d.newStudents, 0),
  evaluations: dailyStats.value.reduce((sum, d) => sum + d.evaluations, 0)
}))
</script>

<template>
  <PageLayout>
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
    </div>
    
    <div v-else class="max-w-4xl mx-auto space-y-6 w-full">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-2xl font-bold text-orange-500">{{ stats?.teachers || 0 }}</div>
          <div class="text-sm text-gray-500">老师数</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-2xl font-bold text-blue-500">{{ stats?.classes || 0 }}</div>
          <div class="text-sm text-gray-500">班级数</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-2xl font-bold text-green-500">{{ stats?.students || 0 }}</div>
          <div class="text-sm text-gray-500">学生数</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-2xl font-bold text-purple-500">{{ stats?.evaluations || 0 }}</div>
          <div class="text-sm text-gray-500">评价数</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-2xl font-bold text-rose-500">{{ stats?.todayEvaluations || 0 }}</div>
          <div class="text-sm text-gray-500">今日评价</div>
        </div>
      </div>

      <!-- 页签切换 -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="flex border-b border-gray-100">
          <button 
            @click="activeTab = 'teachers'"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="activeTab === 'teachers' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-500 hover:text-gray-700'"
          >
            👨‍🏫 老师列表
          </button>
          <button 
            @click="activeTab = 'stats'; loadDailyStats()"
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="activeTab === 'stats' ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-500 hover:text-gray-700'"
          >
            📊 近7天数据
          </button>
        </div>

        <!-- 老师列表 -->
        <div v-if="activeTab === 'teachers'">
          <div v-if="teachers.length === 0" class="p-8 text-center text-gray-400">暂无老师数据</div>
          <div v-else class="divide-y divide-gray-100">
            <div v-for="teacher in teachers" :key="teacher.id" class="hover:bg-gray-50">
              <div class="p-4 flex items-center justify-between cursor-pointer" @click="toggleTeacher(teacher.id)">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {{ teacher.username.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-medium text-gray-800 flex items-center gap-2">
                      {{ teacher.username }}
                      <span v-if="teacher.isAdmin" class="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">管理员</span>
                    </div>
                    <div class="text-sm text-gray-500">注册于 {{ formatDate(teacher.createdAt) }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-sm">
                  <div class="text-center"><div class="font-bold text-blue-500">{{ teacher.classCount }}</div><div class="text-gray-400">班级</div></div>
                  <div class="text-center"><div class="font-bold text-green-500">{{ teacher.totalStudents }}</div><div class="text-gray-400">学生</div></div>
                  <div class="text-center"><div class="font-bold text-purple-500">{{ teacher.totalEvals }}</div><div class="text-gray-400">评价</div></div>
                  <div class="text-gray-400">
                    <span class="inline-block transition-transform duration-200" :class="expandedTeacher === teacher.id ? 'rotate-180' : ''">▼</span>
                  </div>
                </div>
              </div>
              <Transition name="expand">
                <div v-if="expandedTeacher === teacher.id && teacher.classes.length > 0" class="bg-gray-50 px-4 pb-4">
                  <div class="pt-2 space-y-2">
                    <div v-for="cls in teacher.classes" :key="cls.id" class="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">📚</span>
                        <span class="font-medium text-gray-700">{{ cls.name }}</span>
                      </div>
                      <div class="flex items-center gap-4 text-sm">
                        <span class="text-green-600">{{ cls.student_count }} 人</span>
                        <span class="text-purple-600">{{ cls.eval_count }} 条评价</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- 近7天数据 -->
        <div v-else class="p-4">
          <!-- 周汇总 -->
          <div class="grid grid-cols-4 gap-3 mb-6">
            <div class="bg-orange-50 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-orange-600">+{{ weekTotal.newUsers }}</div>
              <div class="text-xs text-gray-500">新用户</div>
            </div>
            <div class="bg-blue-50 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-blue-600">+{{ weekTotal.newClasses }}</div>
              <div class="text-xs text-gray-500">新班级</div>
            </div>
            <div class="bg-green-50 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-green-600">+{{ weekTotal.newStudents }}</div>
              <div class="text-xs text-gray-500">新学生</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-purple-600">{{ weekTotal.evaluations }}</div>
              <div class="text-xs text-gray-500">评价数</div>
            </div>
          </div>

          <!-- 评价趋势图 -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">📈 评价趋势</h4>
            <div class="flex items-end gap-2 h-32 bg-gray-50 rounded-lg p-3">
              <div v-for="day in dailyStats" :key="day.date" class="flex-1 flex flex-col items-center">
                <div 
                  class="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all duration-300"
                  :style="{ height: `${(day.evaluations / maxEvals) * 80}px` }"
                ></div>
                <div class="text-xs text-gray-500 mt-1">{{ formatShortDate(day.date) }}</div>
                <div class="text-xs font-medium text-purple-600">{{ day.evaluations }}</div>
              </div>
            </div>
          </div>

          <!-- 新增学生趋势 -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">👥 新增学生</h4>
            <div class="flex items-end gap-2 h-24 bg-gray-50 rounded-lg p-3">
              <div v-for="day in dailyStats" :key="day.date" class="flex-1 flex flex-col items-center">
                <div 
                  class="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300"
                  :style="{ height: `${(day.newStudents / maxNewStudents) * 60}px` }"
                ></div>
                <div class="text-xs text-gray-500 mt-1">{{ formatShortDate(day.date) }}</div>
              </div>
            </div>
          </div>

          <!-- 新用户/新班级 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">🆕 新用户</h4>
              <div class="flex items-end gap-2 h-20 bg-gray-50 rounded-lg p-3">
                <div v-for="day in dailyStats" :key="day.date" class="flex-1 flex flex-col items-center">
                  <div 
                    class="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                    :style="{ height: `${(day.newUsers / maxNewUsers) * 50}px` }"
                  ></div>
                  <div class="text-xs text-gray-400 mt-1">{{ day.newUsers || '-' }}</div>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">📚 新班级</h4>
              <div class="flex items-end gap-2 h-20 bg-gray-50 rounded-lg p-3">
                <div v-for="day in dailyStats" :key="day.date" class="flex-1 flex flex-col items-center">
                  <div 
                    class="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    :style="{ height: `${(day.newClasses / maxNewClasses) * 50}px` }"
                  ></div>
                  <div class="text-xs text-gray-400 mt-1">{{ day.newClasses || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 汇总 -->
      <div class="bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl p-4">
        <h3 class="font-bold text-gray-700 mb-2">📈 汇总</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>总学生数: <span class="font-bold text-green-600">{{ totalStudents }} 人</span></div>
          <div>总评价数: <span class="font-bold text-purple-600">{{ totalEvals }} 条</span></div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { max-height: 500px; }
</style>