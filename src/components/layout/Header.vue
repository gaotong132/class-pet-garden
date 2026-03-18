<script setup lang="ts">
import { ref } from 'vue'
import type { Class } from '@/types'

defineProps<{
  classes: Class[]
  currentClass: Class | null
  studentCount: number
  isGuest: boolean
  username: string
  batchMode: boolean
}>()

const emit = defineEmits<{
  selectClass: [cls: Class]
  createClass: []
  editClass: []
  deleteClass: []
  addStudent: []
  importStudents: []
  deleteStudents: []
  startBatch: []
  showRank: []
  showRecords: []
  showRules: []
  login: []
  logout: []
  setSort: [by: 'name' | 'studentNo' | 'progress', order: 'asc' | 'desc']
  showPetPreview: []
}>()

const searchQuery = defineModel<string>('searchQuery')

const showClassMenu = ref(false)
const showStudentMenu = ref(false)
const showEvalMenu = ref(false)
const showUserMenu = ref(false)
const showSortMenu = ref(false)
const showPetMenu = ref(false)

const sortBy = ref<'name' | 'studentNo' | 'progress'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

function setSort(by: 'name' | 'studentNo' | 'progress', order: 'asc' | 'desc') {
  sortBy.value = by
  sortOrder.value = order
  showSortMenu.value = false
  emit('setSort', by, order)
}
</script>

<template>
  <header class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-lg px-4 py-3 flex items-center justify-between sticky top-0 z-30">
    <!-- Left -->
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold text-white drop-shadow-lg flex items-center gap-2">
        <span class="text-2xl animate-bounce-slow">🐾</span>
        <span class="text-gradient">班级宠物园</span>
      </h1>
      <select
        v-if="classes.length > 0"
        class="border-0 rounded-xl px-4 py-2 text-sm bg-white/95 hover:bg-white shadow-md backdrop-blur cursor-pointer font-medium"
        :value="currentClass?.id"
        @change="$emit('selectClass', classes.find(c => c.id === ($event.target as HTMLSelectElement).value)!)"
      >
        <option v-for="cls in classes" :key="cls.id" :value="cls.id">
          {{ cls.name }}
        </option>
      </select>
      <span class="text-sm text-white/90 font-medium bg-white/20 px-3 py-1 rounded-full">
        {{ studentCount }} 人
      </span>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-1.5">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="🔍 搜索..."
        class="border-0 rounded-lg px-3 py-1.5 text-sm w-28 bg-white/95 hover:bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
      />

      <!-- Pet Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showPetMenu = !showPetMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          🐕 宠物 ▾
        </button>
        <div v-if="showPetMenu" @click="showPetMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showPetMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <router-link to="/preview" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors flex items-center gap-2">
              📖 图鉴
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- Sort Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showSortMenu = !showSortMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          📊 排序 ▾
        </button>
        <div v-if="showSortMenu" @click="showSortMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showSortMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="setSort('name', 'asc')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors" :class="sortBy === 'name' && sortOrder === 'asc' ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-medium' : ''">🔤 A-Z</button>
            <button @click="setSort('name', 'desc')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors" :class="sortBy === 'name' && sortOrder === 'desc' ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-medium' : ''">🔤 Z-A</button>
            <button @click="setSort('studentNo', 'asc')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors" :class="sortBy === 'studentNo' ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-medium' : ''">🔢 学号</button>
            <button @click="setSort('progress', 'desc')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors" :class="sortBy === 'progress' ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-medium' : ''">⭐ 进度</button>
          </div>
        </Transition>
      </div>

      <!-- Class Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showClassMenu = !showClassMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          📚 班级 ▾
        </button>
        <div v-if="showClassMenu" @click="showClassMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showClassMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="$emit('createClass')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">➕ 新建</button>
            <button v-if="currentClass" @click="$emit('editClass')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">✏️ 重命名</button>
            <button v-if="currentClass" @click="$emit('deleteClass')" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">🗑️ 删除</button>
          </div>
        </Transition>
      </div>

      <!-- Student Menu -->
      <div class="relative" v-if="currentClass && !batchMode">
        <button @click="showStudentMenu = !showStudentMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          👤 学生 ▾
        </button>
        <div v-if="showStudentMenu" @click="showStudentMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showStudentMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="$emit('addStudent')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">➕ 添加</button>
            <button @click="$emit('importStudents')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">📥 导入</button>
            <button @click="$emit('deleteStudents')" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">🗑️ 删除</button>
          </div>
        </Transition>
      </div>

      <!-- Eval Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showEvalMenu = !showEvalMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          ⭐ 评价 ▾
        </button>
        <div v-if="showEvalMenu" @click="showEvalMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showEvalMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="$emit('startBatch')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">✅ 批量</button>
            <button @click="$emit('showRank')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">🏆 排行</button>
            <button @click="$emit('showRecords')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">📋 记录</button>
            <hr class="my-1.5 border-gray-100">
            <button @click="$emit('showRules')" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">⚙️ 规则</button>
          </div>
        </Transition>
      </div>

      <!-- User Menu -->
      <div class="relative">
        <button @click="showUserMenu = !showUserMenu" class="w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md transition-all flex items-center justify-center overflow-hidden">
          <span v-if="isGuest" class="text-lg">👤</span>
          <span v-else class="w-full h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            {{ username.charAt(0).toUpperCase() }}
          </span>
        </button>
        <div v-if="showUserMenu" @click="showUserMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-44 z-50 overflow-hidden">
            <div v-if="isGuest" class="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
              当前为游客模式
            </div>
            <div v-else class="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
              已登录: {{ username }}
            </div>
            <template v-if="isGuest">
              <button @click="$emit('login'); showUserMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">
                🔑 登录 / 注册
              </button>
            </template>
            <template v-else>
              <button @click="$emit('logout'); showUserMenu = false" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                🚪 退出登录
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>