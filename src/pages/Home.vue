<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, nextTick, watch } from 'vue'
import type { Student, Rule, EvaluationRecord } from '@/types'
import { useAuth, setGlobalErrorHandler } from '@/composables/useAuth'
import { useClasses } from '@/composables/useClasses'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useLevelUp } from '@/composables/useLevelUp'
import { usePetStatusAnimation } from '@/composables/usePetStatusAnimation'
import { getPetType } from '@/data/pets'
import { pinyin } from 'pinyin-pro'

// Components
import LoadingScreen from '@/components/LoadingScreen.vue'
import LevelUpModal from '@/components/LevelUpModal.vue'
import StudentCard from '@/components/StudentCard.vue'
import BatchActionBar from '@/components/BatchActionBar.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import AuthModal from '@/components/AuthModal.vue'
import Header from '@/components/layout/Header.vue'
import StudentModal from '@/components/modals/StudentModal.vue'
import ImportModal from '@/components/modals/ImportModal.vue'
import EvaluationModal from '@/components/modals/EvaluationModal.vue'
import PetModal from '@/components/modals/PetModal.vue'
import RecordsModal from '@/components/modals/RecordsModal.vue'
import PetStatusModal from '@/components/PetStatusModal.vue'

// Auth & Toast
const { api } = useAuth()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()
const { showLevelUpAnimation, levelUpInfo, levelUpPhase, triggerLevelUp } = useLevelUp()
const { triggerAnimation: triggerPetStatusAnimation } = usePetStatusAnimation()

// 使用全局班级状态
const { classes, currentClass, loadClasses, syncCurrentClass } = useClasses()

// 设置全局错误处理器
setGlobalErrorHandler((message) => {
  toast.error(message)
})

// State
const students = ref<Student[]>([])
const rules = ref<Rule[]>([])
const searchQuery = ref('')
const sortBy = ref<'name' | 'studentNo' | 'progress'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const isLoading = ref(true)
const isLoaded = ref(false)

// 数据版本控制
const lastDataVersion = ref<number>(0)
function getDataVersion(): number {
  return parseInt(localStorage.getItem('pet-garden-data-version') || '0', 10)
}

// Modal states
const showStudentModal = ref(false)
const showImportModal = ref(false)
const showEvalModal = ref(false)
const showPetModal = ref(false)
const showRecordsModal = ref(false)
const showDetailPanel = ref(false)
const showAuthModal = ref(false)
const selectedStudent = ref<Student | null>(null)
const detailStudent = ref<Student | null>(null)
const studentRecords = ref<EvaluationRecord[]>([])

// Batch mode
const batchMode = ref(false)
const selectedStudents = ref<Set<string>>(new Set())
const showDeleteStudentMode = ref(false)
const deleteStudentList = ref<string[]>([])

// Evaluation records
const evaluationRecords = ref<EvaluationRecord[]>([])
const recordsPage = ref(1)
const totalRecords = ref(0)
const totalPages = ref(0)

// Score animations
const scoreAnimations = ref<Map<string, { points: number; show: boolean }>>(new Map())

// 标签过滤
interface Tag {
  id: string
  name: string
  color: string
}
const allTags = ref<Tag[]>([])
const selectedTagFilter = ref<Tag | null>(null)
const showTagFilter = ref(false)

// 拼音辅助
function getPinyinInitials(text: string): string {
  return pinyin(text, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '').toLowerCase()
}
function getPinyinFull(text: string): string {
  return pinyin(text, { toneType: 'none' }).replace(/\s/g, '').toLowerCase()
}

// Computed
const filteredStudents = computed(() => {
  let result = [...students.value]
  if (selectedTagFilter.value) {
    result = result.filter(s => {
      const studentTags = (s as any).tags || []
      return studentTags.some((t: Tag) => t.id === selectedTagFilter.value!.id)
    })
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(s => {
      if (s.name.toLowerCase().includes(query)) return true
      if (s.student_no && s.student_no.toLowerCase().includes(query)) return true
      if (getPinyinInitials(s.name).includes(query)) return true
      if (getPinyinFull(s.name).includes(query)) return true
      return false
    })
  }
  result.sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'name': comparison = a.name.localeCompare(b.name); break
      case 'studentNo': comparison = (a.student_no || '').localeCompare(b.student_no || ''); break
      case 'progress':
        const levelA = a.pet_level || 0, levelB = b.pet_level || 0
        comparison = levelA !== levelB ? levelA - levelB : (a.pet_exp || 0) - (b.pet_exp || 0)
        break
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  return result
})

// 处理登录成功
function handleLogin(user: { id: string; username: string; isGuest: boolean }) {
  toast.success(`欢迎，${user.username}！`)
  loadClasses()
  loadRules()
}

// 数据加载
async function loadStudents() {
  if (!currentClass.value) return
  try {
    const res = await api.get(`/classes/${currentClass.value.id}/students`)
    students.value = res.data.students
  } catch (error) {
    console.error('加载学生失败:', error)
  }
}

async function loadRules() {
  try {
    const res = await api.get('/rules')
    rules.value = res.data.rules
  } catch (error) {
    console.error('加载规则失败:', error)
  }
}

async function loadTags() {
  try {
    const res = await api.get('/tags')
    allTags.value = res.data.tags
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 学生操作
async function addStudent(name: string, studentNo: string) {
  if (!name.trim() || !currentClass.value) return
  try {
    await api.post('/students', { classId: currentClass.value.id, name: name.trim(), studentNo: studentNo || null })
    showStudentModal.value = false
    localStorage.setItem('pet-garden-data-version', Date.now().toString())
    await loadStudents()
  } catch (error) {
    toast.error('添加学生失败')
  }
}

async function importStudents(text: string) {
  if (!text.trim() || !currentClass.value) return
  const lines = text.trim().split('\n')
  const studentList = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = trimmed.split(/[\t,，;；\s]+/)
    if (parts.length >= 2) {
      studentList.push({ name: parts[0], studentNo: parts.slice(1).join('') })
    } else if (parts.length === 1) {
      studentList.push({ name: parts[0], studentNo: '' })
    }
  }
  if (studentList.length === 0) { toast.warning('没有识别到学生信息'); return }
  try {
    const res = await api.post('/students/import', { classId: currentClass.value.id, students: studentList })
    toast.success(`成功导入 ${res.data.imported} 名学生`)
    showImportModal.value = false
    localStorage.setItem('pet-garden-data-version', Date.now().toString())
    await loadStudents()
  } catch (error) {
    toast.error('导入失败')
  }
}

async function batchDeleteStudents() {
  if (deleteStudentList.value.length === 0) return
  showConfirm({
    title: '删除学生',
    message: `确定删除 ${deleteStudentList.value.length} 名学生？此操作不可恢复！`,
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      let successCount = 0
      for (const studentId of deleteStudentList.value) {
        try {
          await api.delete(`/students/${studentId}`)
          successCount++
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
      toast.success(`已删除 ${successCount} 名学生`)
      cancelDeleteMode()
      localStorage.setItem('pet-garden-data-version', Date.now().toString())
      await loadStudents()
    }
  })
}

// 宠物操作
async function selectPet(petId: string) {
  if (!selectedStudent.value) return
  try {
    await api.put(`/students/${selectedStudent.value.id}/pet`, { petType: petId })
    const pet = getPetType(petId)
    toast.success(`🎉 ${selectedStudent.value.name} 领养了一只 ${pet?.name || '宠物'}！`)
    showPetModal.value = false
    selectedStudent.value = null
    await loadStudents()
    if (detailStudent.value) {
      detailStudent.value = students.value.find(s => s.id === detailStudent.value?.id) || null
    }
  } catch (error) {
    toast.error('领养失败')
  }
}

// 评价操作
function triggerScoreAnimation(studentId: string, points: number) {
  scoreAnimations.value.set(studentId, { points, show: true })
  setTimeout(() => scoreAnimations.value.delete(studentId), 1500)
}

async function handleEvaluate(rule: Rule) {
  if (!currentClass.value) return
  if (!selectedStudent.value) {
    const studentIds = Array.from(selectedStudents.value)
    for (const studentId of studentIds) {
      try {
        await api.post('/evaluations', {
          classId: currentClass.value.id,
          studentId,
          points: rule.points,
          reason: rule.name,
          category: rule.category
        })
        triggerScoreAnimation(studentId, rule.points)
      } catch (error) {
        console.error('评价失败:', error)
      }
    }
    showEvalModal.value = false
    toast.success(`已为 ${studentIds.length} 名学生${rule.points > 0 ? '加' : '扣'}${Math.abs(rule.points)}分`)
    cancelBatchMode()
    await loadStudents()
    return
  }

  try {
    const res = await api.post('/evaluations', {
      classId: currentClass.value.id,
      studentId: selectedStudent.value.id,
      points: rule.points,
      reason: rule.name,
      category: rule.category
    })
    triggerScoreAnimation(selectedStudent.value.id, rule.points)
    if (res.data.levelUp) {
      triggerLevelUp(selectedStudent.value.name, res.data.petLevel, selectedStudent.value.pet_type || '', res.data.petLevel - 1)
    }
    if (res.data.graduated) {
      toast.success(`🎓 恭喜！${selectedStudent.value.name} 的宠物毕业了！`)
    }
    const newTotalPoints = selectedStudent.value.total_points + rule.points
    if (res.data.died) {
      triggerPetStatusAnimation('death', selectedStudent.value.name, selectedStudent.value.pet_type || '', selectedStudent.value.pet_level || 1, 'injured', 'dead', newTotalPoints)
    } else if (res.data.injured) {
      triggerPetStatusAnimation('injured', selectedStudent.value.name, selectedStudent.value.pet_type || '', selectedStudent.value.pet_level || 1, 'alive', 'injured', newTotalPoints)
    } else if (res.data.revived) {
      triggerPetStatusAnimation('revive', selectedStudent.value.name, selectedStudent.value.pet_type || '', selectedStudent.value.pet_level || 1, 'dead', 'alive', newTotalPoints)
    } else if (res.data.healed && !res.data.revived) {
      triggerPetStatusAnimation('heal', selectedStudent.value.name, selectedStudent.value.pet_type || '', selectedStudent.value.pet_level || 1, 'injured', 'alive', newTotalPoints)
    }
    showEvalModal.value = false
    await loadStudents()
  } catch (error) {
    toast.error('评价失败')
  }
}

async function handleDetailEvaluate(rule: Rule) {
  if (!detailStudent.value || !currentClass.value) return
  try {
    const res = await api.post('/evaluations', {
      classId: currentClass.value.id,
      studentId: detailStudent.value.id,
      points: rule.points,
      reason: rule.name,
      category: rule.category
    })
    triggerScoreAnimation(detailStudent.value.id, rule.points)
    if (res.data.levelUp) {
      triggerLevelUp(detailStudent.value.name, res.data.petLevel, detailStudent.value.pet_type || '', res.data.petLevel - 1)
    }
    const newTotalPoints = detailStudent.value.total_points + rule.points
    if (res.data.died) {
      triggerPetStatusAnimation('death', detailStudent.value.name, detailStudent.value.pet_type || '', detailStudent.value.pet_level || 1, 'injured', 'dead', newTotalPoints)
    } else if (res.data.injured) {
      triggerPetStatusAnimation('injured', detailStudent.value.name, detailStudent.value.pet_type || '', detailStudent.value.pet_level || 1, 'alive', 'injured', newTotalPoints)
    } else if (res.data.revived) {
      triggerPetStatusAnimation('revive', detailStudent.value.name, detailStudent.value.pet_type || '', detailStudent.value.pet_level || 1, 'dead', 'alive', newTotalPoints)
    } else if (res.data.healed && !res.data.revived) {
      triggerPetStatusAnimation('heal', detailStudent.value.name, detailStudent.value.pet_type || '', detailStudent.value.pet_level || 1, 'injured', 'alive', newTotalPoints)
    }
    await loadStudents()
    closeDetailPanel()
  } catch (error) {
    toast.error('评价失败')
  }
}

// 详情面板
async function openDetailPanel(student: Student) {
  if (!student.pet_type) {
    showConfirm({
      title: '领养宠物',
      message: `${student.name} 还没有领养宠物，是否现在领养？`,
      confirmText: '去领养',
      onConfirm: () => {
        selectedStudent.value = student
        showPetModal.value = true
      }
    })
    return
  }
  detailStudent.value = student
  showDetailPanel.value = true
  await loadStudentRecords(student.id)
}

async function loadStudentRecords(studentId: string) {
  try {
    const res = await api.get(`/evaluations?studentId=${studentId}&pageSize=20`)
    studentRecords.value = res.data.records || []
  } catch (error) {
    studentRecords.value = []
  }
}

function closeDetailPanel() {
  showDetailPanel.value = false
  detailStudent.value = null
  studentRecords.value = []
}

// 批量模式
function startBatchMode() {
  batchMode.value = true
  selectedStudents.value = new Set()
}

function cancelBatchMode() {
  batchMode.value = false
  selectedStudents.value = new Set()
}

function selectAllFiltered() {
  const newSet = new Set(selectedStudents.value)
  for (const student of filteredStudents.value) {
    newSet.add(student.id)
  }
  selectedStudents.value = newSet
}

function toggleStudentSelect(studentId: string) {
  const newSet = new Set(selectedStudents.value)
  if (newSet.has(studentId)) newSet.delete(studentId)
  else newSet.add(studentId)
  selectedStudents.value = newSet
}

function cancelDeleteMode() {
  showDeleteStudentMode.value = false
  deleteStudentList.value = []
}

function toggleDeleteStudent(studentId: string) {
  const index = deleteStudentList.value.indexOf(studentId)
  if (index > -1) deleteStudentList.value.splice(index, 1)
  else deleteStudentList.value.push(studentId)
}

// 记录
async function loadEvaluationRecords() {
  if (!currentClass.value) return
  const res = await api.get(`/evaluations?classId=${currentClass.value.id}&page=${recordsPage.value}&pageSize=20`)
  evaluationRecords.value = res.data.records
  totalRecords.value = res.data.total
  totalPages.value = res.data.totalPages
}

async function handleUndoLastEvaluation(recordId?: string) {
  if (!currentClass.value) return
  showConfirm({
    title: '撤回评价',
    message: '确定要撤回这条评价吗？',
    confirmText: '撤回',
    type: 'warning',
    onConfirm: async () => {
      try {
        let res
        if (recordId) res = await api.delete(`/evaluations/${recordId}`)
        else res = await api.delete(`/evaluations/latest?classId=${currentClass.value!.id}`)
        if (res.data.success) {
          toast.success(`已撤回：${res.data.undone.points > 0 ? '+' : ''}${res.data.undone.points}分`)
          localStorage.setItem('pet-garden-data-version', Date.now().toString())
          await loadStudents()
          await loadEvaluationRecords()
        }
      } catch (error) {
        toast.error('撤回失败')
      }
    }
  })
}

// 监听班级变化，重新加载学生
watch(currentClass, (newClass) => {
  if (newClass) {
    loadStudents()
  } else {
    students.value = []
  }
})

// 监听登录弹窗信号
function checkShowLogin() {
  if (localStorage.getItem('pet-garden-show-login') === '1') {
    localStorage.removeItem('pet-garden-show-login')
    showAuthModal.value = true
  }
}

// 监听 storage 事件（Header 触发）
function handleStorageEvent(e: StorageEvent) {
  if (e.key === 'pet-garden-show-login') {
    checkShowLogin()
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    await loadClasses()
    await loadRules()
    await loadTags()
    if (currentClass.value) {
      await loadStudents()
    }
    lastDataVersion.value = getDataVersion()
    
    checkShowLogin()
    window.addEventListener('storage', handleStorageEvent)
  } finally {
    isLoading.value = false
    nextTick(() => { isLoaded.value = true })
  }
})

onActivated(() => {
  checkShowLogin()
  syncCurrentClass()
  const currentVersion = getDataVersion()
  if (currentVersion > lastDataVersion.value) {
    lastDataVersion.value = currentVersion
    loadStudents()
  }
  loadRules()
  loadTags()
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageEvent)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col">
    <!-- Loading -->
    <LoadingScreen :show="isLoading" />

    <!-- Level Up Modal -->
    <LevelUpModal
      :show="showLevelUpAnimation"
      :name="levelUpInfo.name"
      :level="levelUpInfo.level"
      :pet-type="levelUpInfo.petType"
      :prev-level="levelUpInfo.prevLevel"
      :phase="levelUpPhase"
    />

    <!-- Pet Status Modal -->
    <PetStatusModal />

    <!-- Header -->
    <Header :batch-mode="batchMode" />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto p-6">
      <!-- 工具栏 -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <!-- 左侧：搜索、标签、排序 -->
        <template v-if="students.length > 0 && !batchMode">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 搜索学生..."
            class="w-48 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:border-orange-400 transition-colors"
          />

          <!-- 标签过滤 -->
          <div v-if="allTags.length > 0" class="relative">
            <button
              @click="showTagFilter = !showTagFilter"
              class="flex items-center gap-1.5 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white shadow-sm hover:border-orange-400 transition-colors"
              :class="selectedTagFilter ? 'border-orange-400 text-orange-600' : 'text-gray-600'"
            >
              <span>🏷️</span>
              <span>{{ selectedTagFilter?.name || '标签' }}</span>
              <span class="text-gray-400 text-xs">▾</span>
            </button>
            <div v-if="showTagFilter" @click="showTagFilter = false" class="fixed inset-0 z-40"></div>
            <Transition name="dropdown">
              <div v-if="showTagFilter" class="absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-36 z-50 overflow-hidden">
                <button v-if="selectedTagFilter" @click="selectedTagFilter = null; showTagFilter = false" class="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors">✕ 清除筛选</button>
                <button v-for="tag in allTags" :key="tag.id" @click="selectedTagFilter = tag; showTagFilter = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2" :class="selectedTagFilter?.id === tag.id ? 'bg-orange-50 text-orange-600 font-medium' : ''">
                  <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: tag.color }"></span>{{ tag.name }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- 排序按钮组 -->
          <div class="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
            <button @click="sortBy = 'name'; sortOrder = 'asc'" class="px-2 py-1 text-xs rounded-md transition-colors" :class="sortBy === 'name' && sortOrder === 'asc' ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'">A-Z</button>
            <button @click="sortBy = 'name'; sortOrder = 'desc'" class="px-2 py-1 text-xs rounded-md transition-colors" :class="sortBy === 'name' && sortOrder === 'desc' ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'">Z-A</button>
            <button @click="sortBy = 'studentNo'; sortOrder = 'asc'" class="px-2 py-1 text-xs rounded-md transition-colors" :class="sortBy === 'studentNo' ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'">学号</button>
            <button @click="sortBy = 'progress'; sortOrder = 'desc'" class="px-2 py-1 text-xs rounded-md transition-colors" :class="sortBy === 'progress' ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'">进度</button>
          </div>

          <span class="text-sm text-gray-500">{{ students.length }} 人</span>
        </template>

        <!-- 批量模式提示 -->
        <div v-if="batchMode" class="flex items-center gap-2 text-orange-600 font-medium">
          <span>✅</span>
          <span>已选择 {{ selectedStudents.size }} 人</span>
        </div>

        <div class="flex-1"></div>

        <!-- 右侧：批量操作按钮 -->
        <button v-if="students.length > 0 && !batchMode" @click="startBatchMode" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all">✅ 批量评价</button>
        <template v-if="batchMode">
          <button @click="selectAllFiltered" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all">📋 全选 ({{ filteredStudents.length }})</button>
          <button @click="cancelBatchMode" class="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium text-sm shadow-sm hover:bg-orange-600 transition-all">✕ 退出批量评价</button>
        </template>
      </div>

      <Transition name="fade" mode="out-in">
        <!-- 无班级状态 -->
        <div v-if="classes.length === 0" key="no-class" class="flex flex-col items-center justify-center min-h-[60vh]">
          <div class="text-8xl mb-6 animate-float">🏫</div>
          <h3 class="text-2xl font-bold text-gray-700 mb-3">还没有班级</h3>
          <p class="text-gray-500 mb-6 text-lg">在顶部导航栏创建一个班级，开启你的宠物园之旅吧！</p>
        </div>

        <!-- 无学生状态 -->
        <div v-else-if="students.length === 0" key="no-student" class="flex flex-col items-center justify-center min-h-[60vh]">
          <div class="text-8xl mb-6 animate-float">👨‍🎓</div>
          <h3 class="text-2xl font-bold text-gray-700 mb-3">还没有学生</h3>
          <p class="text-gray-500 mb-6 text-lg">添加学生，让他们领养可爱的宠物吧！</p>
          <div class="flex gap-3">
            <button @click="showStudentModal = true" class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-bold">➕ 添加学生</button>
            <button @click="showImportModal = true" class="bg-white text-gray-700 px-6 py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-bold border border-gray-200">📥 批量导入</button>
          </div>
        </div>

        <!-- 学生列表 -->
        <div v-else key="students" class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          <StudentCard
            v-for="student in filteredStudents"
            :key="student.id"
            :student="student"
            :is-selected="batchMode && selectedStudents.has(student.id)"
            :is-delete-mode="showDeleteStudentMode"
            :is-delete-selected="showDeleteStudentMode && deleteStudentList.includes(student.id)"
            :score-animation="scoreAnimations.get(student.id)"
            @click="batchMode ? toggleStudentSelect(student.id) : showDeleteStudentMode ? toggleDeleteStudent(student.id) : openDetailPanel(student)"
          />
        </div>
      </Transition>

      <!-- Batch Action Bar -->
      <BatchActionBar
        v-if="batchMode"
        :selected-count="selectedStudents.size"
        mode="batch"
        @evaluate="selectedStudent = null; showEvalModal = true"
      />

      <BatchActionBar
        v-if="showDeleteStudentMode"
        :selected-count="deleteStudentList.length"
        mode="delete"
        @confirm-delete="batchDeleteStudents"
        @cancel="cancelDeleteMode"
      />
    </main>

    <!-- Modals -->
    <StudentModal :show="showStudentModal" @close="showStudentModal = false" @submit="addStudent" />
    <ImportModal :show="showImportModal" @close="showImportModal = false" @submit="importStudents" />
    <EvaluationModal :show="showEvalModal" :selected-count="selectedStudents.size" :rules="rules" @close="showEvalModal = false" @evaluate="handleEvaluate" />
    <PetModal :show="showPetModal" :student="selectedStudent" @close="showPetModal = false; selectedStudent = null" @select="selectPet" />
    <RecordsModal :show="showRecordsModal" :records="evaluationRecords" :total-records="totalRecords" :page="recordsPage" :total-pages="totalPages" @close="showRecordsModal = false" @undo="handleUndoLastEvaluation" @prev-page="recordsPage--; loadEvaluationRecords()" @next-page="recordsPage++; loadEvaluationRecords()" @go-to-page="recordsPage = $event; loadEvaluationRecords()" />
    <DetailPanel :show="showDetailPanel" :student="detailStudent" :rules="rules" :student-records="studentRecords" @close="closeDetailPanel" @change-pet="showDetailPanel = false; selectedStudent = detailStudent; showPetModal = true" @evaluate="handleDetailEvaluate" />
    <ConfirmDialog :show="confirmDialog.show" :title="confirmDialog.title" :message="confirmDialog.message" :confirm-text="confirmDialog.confirmText" :cancel-text="confirmDialog.cancelText" :type="confirmDialog.type" @confirm="confirmDialog.onConfirm" @cancel="closeConfirm" />
    <AuthModal :show="showAuthModal" @close="showAuthModal = false" @login="handleLogin($event)" />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px); }
</style>