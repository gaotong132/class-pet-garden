<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

interface Class {
  id: string
  name: string
  created_at: number
}

interface Student {
  id: string
  class_id: string
  name: string
  student_no: string | null
  total_points: number
  pet_type: string | null
  pet_level: number
  pet_exp: number
}

const classes = ref<Class[]>([])
const currentClass = ref<Class | null>(null)
const students = ref<Student[]>([])
const showClassModal = ref(false)
const newClassName = ref('')

async function loadClasses() {
  const res = await axios.get('/api/classes')
  classes.value = res.data.classes
  if (classes.value.length > 0 && !currentClass.value) {
    selectClass(classes.value[0])
  }
}

async function selectClass(cls: Class) {
  currentClass.value = cls
  const res = await axios.get(`/api/classes/${cls.id}/students`)
  students.value = res.data.students
}

async function createClass() {
  if (!newClassName.value.trim()) return
  await axios.post('/api/classes', { name: newClassName.value.trim() })
  newClassName.value = ''
  showClassModal.value = false
  loadClasses()
}

onMounted(() => {
  loadClasses()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-primary">🐾 班级宠物园</h1>
          <select 
            v-if="classes.length > 0"
            class="border rounded-lg px-3 py-1.5 text-sm"
            :value="currentClass?.id"
            @change="selectClass(classes.find(c => c.id === ($event.target as HTMLSelectElement).value)!)"
          >
            <option v-for="cls in classes" :key="cls.id" :value="cls.id">
              {{ cls.name }}
            </option>
          </select>
        </div>
        <button 
          @click="showClassModal = true"
          class="bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-orange-500 transition"
        >
          + 新建班级
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Empty State -->
      <div v-if="classes.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4">🏫</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">还没有班级</h2>
        <p class="text-gray-500 mb-6">创建一个班级开始使用吧！</p>
        <button 
          @click="showClassModal = true"
          class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition"
        >
          创建第一个班级
        </button>
      </div>

      <!-- Students Grid -->
      <div v-else-if="students.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
          v-for="student in students" 
          :key="student.id"
          class="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
        >
          <div class="text-center">
            <div class="text-4xl mb-2">
              {{ student.pet_type ? '🐾' : '❓' }}
            </div>
            <div class="font-bold text-gray-800">{{ student.name }}</div>
            <div class="text-sm text-gray-500">Lv.{{ student.pet_level }}</div>
            <div class="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                class="bg-primary rounded-full h-2 transition-all"
                :style="{ width: `${Math.min(100, (student.pet_exp % 40) * 2.5)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Students -->
      <div v-else class="text-center py-20">
        <div class="text-6xl mb-4">👨‍🎓</div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">还没有学生</h2>
        <p class="text-gray-500">点击左侧工具栏添加学生</p>
      </div>
    </main>

    <!-- Create Class Modal -->
    <div v-if="showClassModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-96">
        <h3 class="text-lg font-bold mb-4">创建班级</h3>
        <input 
          v-model="newClassName"
          type="text" 
          placeholder="班级名称"
          class="w-full border rounded-lg px-4 py-2 mb-4"
          @keyup.enter="createClass"
        />
        <div class="flex gap-2 justify-end">
          <button 
            @click="showClassModal = false"
            class="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            取消
          </button>
          <button 
            @click="createClass"
            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-500"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>