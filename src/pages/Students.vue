<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import type { Student, Class } from '@/types'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import Header from '@/components/layout/Header.vue'
import { getPetLevelImage } from '@/data/pets'
import { pinyin } from 'pinyin-pro'

// 辅助函数：获取拼音首字母
function getPinyinInitials(text: string): string {
  return pinyin(text, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '').toLowerCase()
}

// 辅助函数：获取完整拼音
function getPinyinFull(text: string): string {
  return pinyin(text, { toneType: 'none' }).replace(/\s/g, '').toLowerCase()
}

const { api, isGuest, username } = useAuth()
const toast = useToast()
const { confirmDialog, showConfirm, closeConfirm } = useConfirm()

const classes = ref<Class[]>([])
const currentClass = ref<Class | null>(null)
const students = ref<Student[]>([])
const isLoading = ref(true)

// 搜索和筛选
const searchQuery = ref('')
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const query = searchQuery.value.toLowerCase().trim()
  return students.value.filter(s => {
    // 1. 姓名匹配
    if (s.name.toLowerCase().includes(query)) return true
    
    // 2. 学号匹配
    if (s.student_no && s.student_no.toLowerCase().includes(query)) return true
    
    // 3. 拼音首字母匹配（如 "cxm" 匹配 "陈小明"）
    const initials = getPinyinInitials(s.name)
    if (initials.includes(query)) return true
    
    // 4. 完整拼音匹配
    const fullPinyin = getPinyinFull(s.name)
    if (fullPinyin.includes(query)) return true
    
    return false
  })
})

// 选中的学生（用于批量操作）
const selectedIds = ref<Set<string>>(new Set())
const isAllSelected = computed(() => 
  filteredStudents.value.length > 0 && 
  filteredStudents.value.every(s => selectedIds.value.has(s.id))
)

// 编辑学生
const editingStudent = ref<Student | null>(null)
const editName = ref('')
const editStudentNo = ref('')

// 新增学生
const showAddForm = ref(false)
const newStudentName = ref('')
const newStudentNo = ref('')

// 批量导入
const showImportForm = ref(false)
const importText = ref('')

function getPetImage(student: Student): string {
  if (!student.pet_type) return ''
  const level = Math.max(1, Math.min(8, student.pet_level || 1))
  return getPetLevelImage(student.pet_type, level)
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

async function loadStudents() {
  if (!currentClass.value) return
  isLoading.value = true
  try {
    const res = await api.get(`/classes/${currentClass.value.id}/students`)
    students.value = res.data.students
  } catch (error) {
    console.error('加载学生失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 选择操作
function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value.clear()
  } else {
    filteredStudents.value.forEach(s => selectedIds.value.add(s.id))
  }
}

// 新增学生
async function addStudent() {
  if (!newStudentName.value.trim()) {
    toast.warning('请输入学生姓名')
    return
  }
  try {
    await api.post(`/classes/${currentClass.value!.id}/students`, {
      name: newStudentName.value.trim(),
      student_no: newStudentNo.value.trim() || null
    })
    toast.success('添加成功')
    newStudentName.value = ''
    newStudentNo.value = ''
    showAddForm.value = false
    localStorage.setItem('pet-garden-data-version', Date.now().toString())
    loadStudents()
  } catch (error) {
    toast.error('添加失败')
  }
}

// 编辑学生
function startEdit(student: Student) {
  editingStudent.value = student
  editName.value = student.name
  editStudentNo.value = student.student_no || ''
}

function cancelEdit() {
  editingStudent.value = null
}

async function saveEdit() {
  if (!editingStudent.value || !editName.value.trim()) return
  try {
    await api.put(`/students/${editingStudent.value.id}`, {
      name: editName.value.trim(),
      studentNo: editStudentNo.value.trim() || null
    })
    toast.success('保存成功')
    editingStudent.value = null
    localStorage.setItem('pet-garden-data-version', Date.now().toString())
    loadStudents()
  } catch (error) {
    toast.error('保存失败')
  }
}

// 删除学生
async function deleteStudent(id: string) {
  showConfirm({
    title: '删除学生',
    message: '确定删除该学生？相关的评价记录也会被删除。',
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      try {
        await api.delete(`/students/${id}`)
        toast.success('删除成功')
        selectedIds.value.delete(id)
        localStorage.setItem('pet-garden-data-version', Date.now().toString())
        loadStudents()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  })
}

// 批量删除
async function deleteSelected() {
  if (selectedIds.value.size === 0) return
  showConfirm({
    title: '批量删除',
    message: `确定删除选中的 ${selectedIds.value.size} 名学生？相关的评价记录也会被删除。`,
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      try {
        await api.post('/students/batch-delete', {
          ids: Array.from(selectedIds.value)
        })
        toast.success(`已删除 ${selectedIds.value.size} 名学生`)
        selectedIds.value.clear()
        localStorage.setItem('pet-garden-data-version', Date.now().toString())
        loadStudents()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  })
}

// 批量导入
async function importStudents() {
  if (!importText.value.trim()) {
    toast.warning('请输入学生信息')
    return
  }
  
  const lines = importText.value.trim().split('\n').filter(l => l.trim())
  const data = lines.map(line => {
    const parts = line.trim().split(/[,，\t\s]+/)
    return {
      name: parts[0]?.trim() || '',
      student_no: parts[1]?.trim() || null
    }
  }).filter(s => s.name)
  
  if (data.length === 0) {
    toast.warning('没有有效的学生数据')
    return
  }
  
  try {
    await api.post(`/classes/${currentClass.value!.id}/students/batch`, { students: data })
    toast.success(`成功导入 ${data.length} 名学生`)
    importText.value = ''
    showImportForm.value = false
    localStorage.setItem('pet-garden-data-version', Date.now().toString())
    loadStudents()
  } catch (error) {
    toast.error('导入失败')
  }
}

// 检查班级是否变化
function syncCurrentClass() {
  const savedClassId = localStorage.getItem('pet-garden-current-class')
  if (savedClassId && savedClassId !== currentClass.value?.id) {
    currentClass.value = classes.value.find(c => c.id === savedClassId) || classes.value[0]
    selectedIds.value.clear()
    loadStudents()
  }
}

onMounted(async () => {
  await loadClasses()
  await loadStudents()
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
      <div class="max-w-5xl mx-auto">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span class="text-3xl">👥</span> 学生管理
            </h1>
            <p class="text-gray-500 text-sm mt-1" v-if="students.length > 0">
              共 {{ students.length }} 名学生
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="selectedIds.size > 0"
              @click="deleteSelected"
              class="px-4 py-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl font-medium transition-colors"
            >
              🗑️ 删除选中 ({{ selectedIds.size }})
            </button>
            <button
              @click="showImportForm = true"
              class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-xl font-medium transition-colors"
            >
              📥 批量导入
            </button>
            <button
              @click="showAddForm = true"
              class="px-4 py-2 text-sm text-white bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl font-medium shadow-sm hover:shadow-md transition-all"
            >
              ➕ 添加学生
            </button>
          </div>
        </div>

        <!-- 搜索 -->
        <div class="mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 搜索学生..."
            class="w-full max-w-sm border-2 border-gray-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <!-- 加载中 -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="text-6xl animate-bounce mb-4">👥</div>
            <div class="text-gray-500">加载中...</div>
          </div>
        </div>

        <!-- 无学生 -->
        <div v-else-if="students.length === 0" class="text-center py-20 text-gray-500 bg-white rounded-2xl shadow-sm">
          <div class="text-6xl mb-4">👨‍🎓</div>
          <div>暂无学生</div>
          <button @click="showAddForm = true" class="mt-4 text-orange-500 hover:text-orange-600 font-medium">
            添加第一个学生
          </button>
        </div>

        <!-- 学生列表 -->
        <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- 表头 -->
          <div class="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
            <div class="col-span-1 flex items-center">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
            </div>
            <div class="col-span-1">宠物</div>
            <div class="col-span-3">姓名</div>
            <div class="col-span-2">学号</div>
            <div class="col-span-1">积分</div>
            <div class="col-span-1">等级</div>
            <div class="col-span-3 text-right">操作</div>
          </div>

          <!-- 学生行 -->
          <div 
            v-for="student in filteredStudents" 
            :key="student.id"
            class="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors items-center"
            :class="{ 'bg-orange-50/30': selectedIds.has(student.id) }"
          >
            <!-- 选择框 -->
            <div class="col-span-1">
              <input 
                type="checkbox" 
                :checked="selectedIds.has(student.id)"
                @change="toggleSelect(student.id)"
                class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
            </div>

            <!-- 宠物 -->
            <div class="col-span-1">
              <div v-if="student.pet_type" class="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100">
                <img :src="getPetImage(student)" class="w-full h-full object-contain" />
              </div>
              <div v-else class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                ❓
              </div>
            </div>

            <!-- 编辑模式 -->
            <template v-if="editingStudent?.id === student.id">
              <div class="col-span-3">
                <input 
                  v-model="editName"
                  type="text"
                  class="w-full border-2 border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
                  @keyup.enter="saveEdit"
                  @keyup.escape="cancelEdit"
                />
              </div>
              <div class="col-span-2">
                <input 
                  v-model="editStudentNo"
                  type="text"
                  class="w-full border-2 border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
                  @keyup.enter="saveEdit"
                  @keyup.escape="cancelEdit"
                />
              </div>
              <div class="col-span-1 text-sm text-gray-600">{{ student.total_points }}</div>
              <div class="col-span-1 text-sm text-gray-600">Lv.{{ student.pet_level || 1 }}</div>
              <div class="col-span-3 text-right">
                <button @click="saveEdit" class="text-green-500 hover:text-green-600 text-sm font-medium px-2 py-1">保存</button>
                <button @click="cancelEdit" class="text-gray-400 hover:text-gray-600 text-sm font-medium px-2 py-1">取消</button>
              </div>
            </template>

            <!-- 显示模式 -->
            <template v-else>
              <div class="col-span-3 font-medium text-gray-800">{{ student.name }}</div>
              <div class="col-span-2 text-sm text-gray-500">{{ student.student_no || '-' }}</div>
              <div class="col-span-1 text-sm font-medium text-orange-500">{{ student.total_points }}</div>
              <div class="col-span-1 text-sm text-gray-600">Lv.{{ student.pet_level || 1 }}</div>
              <div class="col-span-3 text-right">
                <button @click="startEdit(student)" class="text-blue-500 hover:text-blue-600 text-sm px-2">编辑</button>
                <button @click="deleteStudent(student.id)" class="text-red-400 hover:text-red-600 text-sm px-2">删除</button>
              </div>
            </template>
          </div>
        </div>

        <!-- 搜索无结果 -->
        <div v-if="!isLoading && students.length > 0 && filteredStudents.length === 0" class="text-center py-12 text-gray-500">
          没有找到匹配的学生
        </div>
      </div>
    </main>

    <!-- 添加学生弹窗 -->
    <Transition name="modal">
      <div v-if="showAddForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showAddForm = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-lg font-bold mb-4">➕ 添加学生</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-500 mb-1">姓名 *</label>
              <input 
                v-model="newStudentName"
                type="text"
                placeholder="请输入学生姓名"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                @keyup.enter="addStudent"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">学号（可选）</label>
              <input 
                v-model="newStudentNo"
                type="text"
                placeholder="请输入学号"
                class="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                @keyup.enter="addStudent"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button @click="showAddForm = false" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">取消</button>
            <button @click="addStudent" class="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl text-sm font-medium shadow-sm">添加</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 批量导入弹窗 -->
    <Transition name="modal">
      <div v-if="showImportForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showImportForm = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
          <h3 class="text-lg font-bold mb-4">📥 批量导入学生</h3>
          <p class="text-sm text-gray-500 mb-3">每行一个学生，格式：<code class="bg-gray-100 px-1 rounded">姓名,学号</code> 或 <code class="bg-gray-100 px-1 rounded">姓名</code></p>
          <textarea 
            v-model="importText"
            rows="10"
            placeholder="张三,001&#10;李四,002&#10;王五,003"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 font-mono"
          ></textarea>
          <div class="flex justify-end gap-2 mt-4">
            <button @click="showImportForm = false" class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">取消</button>
            <button @click="importStudents" class="px-4 py-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl text-sm font-medium shadow-sm">导入</button>
          </div>
        </div>
      </div>
    </Transition>

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

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div, .modal-leave-to > div {
  transform: scale(0.95);
}
</style>