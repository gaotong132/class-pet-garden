<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Student, Class, Rule, EvaluationRecord } from '@/types'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useLevelUp } from '@/composables/useLevelUp'
import { getPetType } from '@/data/pets'

// Components
import LoadingScreen from '@/components/LoadingScreen.vue'
import LevelUpModal from '@/components/LevelUpModal.vue'
import StudentCard from '@/components/StudentCard.vue'
import BatchActionBar from '@/components/BatchActionBar.vue'
import DetailPanel from '@/components/DetailPanel.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import AuthModal from '@/components/AuthModal.vue'
import Header from '@/components/layout/Header.vue'
import ClassModal from '@/components/modals/ClassModal.vue'
import StudentModal from '@/components/modals/StudentModal.vue'
import ImportModal from '@/components/modals/ImportModal.vue'
import EvaluationModal from '@/components/modals/EvaluationModal.vue'
import PetModal from '@/components/modals/PetModal.vue'
import RankModal from '@/components/modals/RankModal.vue'
import RecordsModal from '@/components/modals/RecordsModal.vue'
import RulesModal from '@/components/modals/RulesModal.vue'

// Auth & Toast
const { isGuest, username, logout, api } = useAuth()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()
const { showLevelUpAnimation, levelUpInfo, levelUpPhase, triggerLevelUp } = useLevelUp()

// State
const classes = ref<Class[]>([])
const currentClass = ref<Class | null>(null)
const students = ref<Student[]>([])
const rules = ref<Rule[]>([])
const searchQuery = ref('')
const sortBy = ref<'name' | 'studentNo' | 'progress'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const isLoading = ref(true)
const isLoaded = ref(false)

// Modal states
const showClassModal = ref(false)
const showStudentModal = ref(false)
const showImportModal = ref(false)
const showEvalModal = ref(false)
const showPetModal = ref(false)
const showRankModal = ref(false)
const showRecordsModal = ref(false)
const showRulesModal = ref(false)
const showDetailPanel = ref(false)
const showAuthModal = ref(false)
const editingClass = ref<Class | null>(null)
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

// Computed
const filteredStudents = computed(() => {
  let result = [...students.value]
  if (searchQuery.value) {
    result = result.filter(s => s.name.includes(searchQuery.value))
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

const selectedEvalTab = ref('学习')
const detailEvalTab = ref('学习')

// API functions
async function loadClasses() {
  try {
    const res = await api.get('/classes')
    classes.value = res.data.classes
    if (classes.value.length > 0) {
      const savedClassId = localStorage.getItem('pet-garden-current-class')
      const savedClass = savedClassId ? classes.value.find(c => c.id === savedClassId) : null
      if (savedClass) await selectClass(savedClass)
      else if (!currentClass.value || !classes.value.find(c => c.id === currentClass.value?.id)) {
        await selectClass(classes.value[0])
      }
    } else {
      currentClass.value = null
      students.value = []
    }
  } catch (error) {
    console.error('加载班级失败:', error)
  }
}

async function selectClass(cls: Class) {
  currentClass.value = cls
  localStorage.setItem('pet-garden-current-class', cls.id)
  await loadStudents()
}

async function loadStudents() {
  if (!currentClass.value) return
  const res = await api.get(`/classes/${currentClass.value.id}/students`)
  students.value = res.data.students
}

async function loadRules() {
  const res = await api.get('/rules')
  rules.value = res.data.rules
}

// Class actions
async function createClass(name: string) {
  if (!name.trim()) { toast.warning('请输入班级名称'); return }
  try {
    await api.post('/classes', { name: name.trim() })
    showClassModal.value = false
    editingClass.value = null
    await loadClasses()
    toast.success('班级创建成功！')
  } catch (error) {
    toast.error('创建班级失败，请重试')
  }
}

async function updateClass(name: string) {
  if (!editingClass.value || !name.trim()) return
  try {
    await api.put(`/classes/${editingClass.value.id}`, { name: name.trim() })
    if (currentClass.value?.id === editingClass.value.id) {
      currentClass.value = { ...currentClass.value, name: name.trim() }
    }
    showClassModal.value = false
    editingClass.value = null
    await loadClasses()
  } catch (error) {
    toast.error('更新班级失败')
  }
}

function openCreateClassModal() {
  editingClass.value = null
  showClassModal.value = true
}

function openEditClassModal() {
  if (!currentClass.value) return
  editingClass.value = currentClass.value
  showClassModal.value = true
}

function handleDeleteClass() {
  if (!currentClass.value) return
  showConfirm({
    title: '删除班级',
    message: '确定删除该班级？所有学生数据将一并删除！',
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      await api.delete(`/classes/${currentClass.value!.id}`)
      currentClass.value = null
      students.value = []
      await loadClasses()
      toast.success('班级删除成功！')
    }
  })
}

// Student actions
async function addStudent(name: string, studentNo: string) {
  if (!name.trim() || !currentClass.value) return
  try {
    await api.post('/students', { classId: currentClass.value.id, name: name.trim(), studentNo: studentNo || null })
    showStudentModal.value = false
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
    const parts = trimmed.split(/[\t,\s;]+/)
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
      await loadStudents()
    }
  })
}

// Pet actions
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

// Evaluation actions
function triggerScoreAnimation(studentId: string, points: number) {
  scoreAnimations.value.set(studentId, { points, show: true })
  setTimeout(() => scoreAnimations.value.delete(studentId), 1500)
}

async function handleEvaluate(rule: Rule) {
  if (!currentClass.value) return

  if (!selectedStudent.value) {
    // Batch mode
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
    await loadStudents()
    closeDetailPanel()
  } catch (error) {
    toast.error('评价失败')
  }
}

// Detail panel
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
  detailEvalTab.value = '学习'
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

// Batch mode
function startBatchMode() {
  batchMode.value = true
  selectedStudents.value = new Set()
}

function cancelBatchMode() {
  batchMode.value = false
  selectedStudents.value = new Set()
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

// Records
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
          await loadStudents()
          await loadEvaluationRecords()
        }
      } catch (error) {
        toast.error('撤回失败')
      }
    }
  })
}

// Rules
async function addRule(name: string, points: number, category: string) {
  if (!name.trim()) { toast.warning('请输入规则名称'); return }
  try {
    await api.post('/rules', { name, points, category })
    toast.success('添加成功！')
    await loadRules()
  } catch (error) {
    toast.error('添加失败')
  }
}

async function deleteRule(id: string) {
  showConfirm({
    title: '删除规则',
    message: '确定删除该规则？',
    confirmText: '删除',
    type: 'warning',
    onConfirm: async () => {
      await api.delete(`/rules/${id}`)
      await loadRules()
      toast.success('删除成功！')
    }
  })
}

// Initialize
onMounted(async () => {
  isLoading.value = true
  try {
    await loadClasses()
    await loadRules()
  } finally {
    isLoading.value = false
    nextTick(() => { isLoaded.value = true })
  }
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

    <!-- Header -->
    <Header
      :classes="classes"
      :current-class="currentClass"
      :student-count="students.length"
      :is-guest="isGuest"
      :username="username"
      :batch-mode="batchMode"
      v-model:search-query="searchQuery"
      @select-class="selectClass"
      @create-class="openCreateClassModal"
      @edit-class="openEditClassModal"
      @delete-class="handleDeleteClass"
      @add-student="showStudentModal = true"
      @import-students="showImportModal = true"
      @delete-students="showDeleteStudentMode = true; deleteStudentList = []"
      @start-batch="startBatchMode"
      @show-rank="showRankModal = true"
      @show-records="loadEvaluationRecords(); showRecordsModal = true"
      @show-rules="showRulesModal = true"
      @login="showAuthModal = true"
      @logout="logout(); loadClasses(); toast.success('已退出登录')"
      @set-sort="(by, order) => { sortBy = by; sortOrder = order }"
    />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto p-6">
      <Transition name="fade" mode="out-in">
        <!-- 无班级状态 -->
        <div v-if="classes.length === 0" key="no-class" class="flex flex-col items-center justify-center min-h-[60vh]">
          <div class="text-8xl mb-6 animate-float">🏫</div>
          <h3 class="text-2xl font-bold text-gray-700 mb-3">还没有班级</h3>
          <p class="text-gray-500 mb-6 text-lg">创建一个班级，开启你的宠物园之旅吧！</p>
          <button @click="showClassModal = true" class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-bold text-lg">
            ✨ 创建第一个班级
          </button>
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
        @add-points="selectedEvalTab = '学习'; selectedStudent = null; showEvalModal = true"
        @sub-points="selectedEvalTab = '行为'; selectedStudent = null; showEvalModal = true"
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
    <ClassModal :show="showClassModal" :editing="editingClass" @close="showClassModal = false; editingClass = null" @submit="editingClass ? updateClass($event) : createClass($event)" />
    <StudentModal :show="showStudentModal" @close="showStudentModal = false" @submit="addStudent" />
    <ImportModal :show="showImportModal" @close="showImportModal = false" @submit="importStudents" />
    <EvaluationModal :show="showEvalModal" :student="selectedStudent" :selected-count="selectedStudents.size" :rules="rules" @close="showEvalModal = false" @evaluate="handleEvaluate" />
    <PetModal :show="showPetModal" :student="selectedStudent" @close="showPetModal = false; selectedStudent = null" @select="selectPet" />
    <RankModal :show="showRankModal" :students="students" @close="showRankModal = false" />
    <RecordsModal :show="showRecordsModal" :records="evaluationRecords" :total-records="totalRecords" :page="recordsPage" :total-pages="totalPages" @close="showRecordsModal = false" @undo="handleUndoLastEvaluation" @prev-page="recordsPage--; loadEvaluationRecords()" @next-page="recordsPage++; loadEvaluationRecords()" @go-to-page="recordsPage = $event; loadEvaluationRecords()" />
    <RulesModal :show="showRulesModal" :rules="rules" @close="showRulesModal = false" @add-rule="addRule" @delete-rule="deleteRule" />
    <DetailPanel :show="showDetailPanel" :student="detailStudent" :rules="rules" :student-records="studentRecords" @close="closeDetailPanel" @change-pet="showDetailPanel = false; selectedStudent = detailStudent; showPetModal = true" @evaluate="handleDetailEvaluate" />
    <ConfirmDialog :show="confirmDialog.show" :title="confirmDialog.title" :message="confirmDialog.message" :confirm-text="confirmDialog.confirmText" :cancel-text="confirmDialog.cancelText" :type="confirmDialog.type" @confirm="confirmDialog.onConfirm" @cancel="closeConfirm" />
    <AuthModal :show="showAuthModal" @close="showAuthModal = false" @login="toast.success(`欢迎，${$event.username}！`); loadClasses()" />
  </div>
</template>

<style scoped>
/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(0.9); }

.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-10px); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 100%); }

.pop-enter-active, .pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.5); }

.score-pop-enter-active { animation: scorePopIn 0.5s ease-out; }
.score-pop-leave-active { transition: all 0.3s ease; }
.score-pop-leave-to { opacity: 0; transform: scale(0.5); }

@keyframes scorePopIn {
  0% { opacity: 0; transform: scale(0.5); }
  50% { transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes sparkle {
  0% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
  100% { opacity: 0; transform: scale(0) rotate(360deg); }
}

.animate-sparkle { animation: sparkle 0.8s ease-out forwards; }
.animate-bounce-in { animation: bounceIn 0.5s ease-out; }

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #fb923c, #f472b6); border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #f97316, #ec4899); }
</style>