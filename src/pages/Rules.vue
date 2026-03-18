<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import type { Rule, Class } from '@/types'
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
const rules = ref<Rule[]>([])

const categories = ['学习', '行为', '健康', '其他']
const newRuleName = ref('')
const newRulePoints = ref(1)
const newRuleCategory = ref('学习')

// 编辑状态
const editingRule = ref<Rule | null>(null)
const editName = ref('')
const editPoints = ref(1)
const editCategory = ref('学习')

async function loadRules() {
  try {
    const res = await api.get('/rules')
    rules.value = res.data.rules
  } catch (error) {
    console.error('加载规则失败:', error)
  }
}

async function addRule() {
  if (!newRuleName.value.trim()) {
    toast.warning('请输入规则名称')
    return
  }
  try {
    await api.post('/rules', { 
      name: newRuleName.value.trim(), 
      points: newRulePoints.value, 
      category: newRuleCategory.value 
    })
    toast.success('添加成功！')
    newRuleName.value = ''
    newRulePoints.value = 1
    await loadRules()
  } catch (error) {
    toast.error('添加失败')
  }
}

function startEdit(rule: Rule) {
  editingRule.value = rule
  editName.value = rule.name
  editPoints.value = rule.points
  editCategory.value = rule.category
}

function cancelEdit() {
  editingRule.value = null
}

async function saveEdit() {
  if (!editingRule.value || !editName.value.trim()) return
  try {
    await api.put(`/rules/${editingRule.value.id}`, { 
      name: editName.value.trim(), 
      points: editPoints.value, 
      category: editCategory.value 
    })
    toast.success('更新成功！')
    editingRule.value = null
    await loadRules()
  } catch (error) {
    toast.error('更新失败')
  }
}

async function deleteRule(id: string) {
  showConfirm({
    title: '删除规则',
    message: '确定删除该规则？删除后不可恢复。',
    confirmText: '删除',
    type: 'danger',
    onConfirm: async () => {
      try {
        await api.delete(`/rules/${id}`)
        toast.success('删除成功！')
        await loadRules()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  })
}

async function resetRules() {
  showConfirm({
    title: '重置规则',
    message: '确定重置为默认规则？当前所有规则将被删除，恢复为系统预设规则。',
    confirmText: '重置',
    type: 'danger',
    onConfirm: async () => {
      try {
        const res = await api.post('/rules/reset')
        rules.value = res.data.rules
        toast.success(`已重置为默认规则，共 ${res.data.count} 条`)
      } catch (error) {
        toast.error('重置失败')
      }
    }
  })
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

// 检查班级是否变化
function syncCurrentClass() {
  const savedClassId = localStorage.getItem('pet-garden-current-class')
  if (savedClassId && savedClassId !== currentClass.value?.id) {
    currentClass.value = classes.value.find(c => c.id === savedClassId) || classes.value[0]
  }
}

onMounted(() => {
  loadClasses()
  loadRules()
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

    <main class="flex-1 max-w-4xl mx-auto p-6 w-full">
      <!-- 添加规则表单 -->
      <div class="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
          <span>➕</span> 添加新规则
        </h3>
        <div class="flex flex-wrap gap-3 mb-4">
          <input
            v-model="newRuleName"
            type="text"
            placeholder="规则名称"
            class="flex-1 min-w-[200px] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 transition-colors"
            @keyup.enter="addRule"
          />
          <select v-model="newRuleCategory" class="border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 transition-colors cursor-pointer">
            <option v-for="cat in categories" :key="cat">{{ cat }}</option>
          </select>
          <input
            v-model.number="newRulePoints"
            type="number"
            placeholder="分值"
            class="w-24 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>
        <div class="flex gap-3">
          <button
            @click="addRule"
            class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            添加规则
          </button>
          <button
            @click="resetRules"
            class="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-300 transition-all"
          >
            🔄 重置为默认
          </button>
        </div>
      </div>

      <!-- 规则列表 -->
      <div class="space-y-6" v-if="rules.length > 0">
          <template v-for="cat in categories" :key="cat">
            <div v-if="rules.filter(r => r.category === cat).length > 0" class="bg-white rounded-2xl p-6 shadow-lg">
              <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <span>{{ cat === '学习' ? '📚' : cat === '行为' ? '🎯' : cat === '健康' ? '💪' : '📌' }}</span>
                {{ cat }}
                <span class="text-sm font-normal text-gray-400">({{ rules.filter(r => r.category === cat).length }}条)</span>
              </h3>
              <div class="space-y-2">
                <div
                  v-for="rule in rules.filter(r => r.category === cat)"
                  :key="rule.id"
                  class="flex items-center justify-between p-3 rounded-xl border-2 transition-all"
                  :class="rule.points > 0 ? 'bg-green-50 border-green-200 hover:border-green-300' : 'bg-red-50 border-red-200 hover:border-red-300'"
                >
                  <!-- 编辑模式 -->
                  <template v-if="editingRule?.id === rule.id">
                    <div class="flex flex-wrap gap-2 flex-1">
                      <input
                        v-model="editName"
                        type="text"
                        class="flex-1 min-w-[150px] border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                        @keyup.enter="saveEdit"
                        @keyup.escape="cancelEdit"
                      />
                      <select 
                        v-model="editCategory" 
                        class="border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 cursor-pointer"
                      >
                        <option v-for="c in categories" :key="c">{{ c }}</option>
                      </select>
                      <input
                        v-model.number="editPoints"
                        type="number"
                        class="w-20 border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div class="flex gap-1 ml-3">
                      <button @click="saveEdit" class="text-green-600 hover:text-green-700 px-3 py-1.5 font-medium text-sm bg-green-100 rounded-lg hover:bg-green-200 transition-colors">保存</button>
                      <button @click="cancelEdit" class="text-gray-500 hover:text-gray-700 px-3 py-1.5 font-medium text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">取消</button>
                    </div>
                  </template>
                  
                  <!-- 显示模式 -->
                  <template v-else>
                    <div class="flex items-center gap-3">
                      <span
                        class="font-bold text-xl w-14 text-center"
                        :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                      >
                        {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                      </span>
                      <span class="font-medium text-gray-700">{{ rule.name }}</span>
                    </div>
                    <div class="flex gap-1">
                      <button
                        @click="startEdit(rule)"
                        class="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors px-3 py-1.5 hover:bg-blue-50 rounded-lg"
                      >
                        编辑
                      </button>
                      <button
                        @click="deleteRule(rule.id)"
                        class="text-red-400 hover:text-red-600 text-sm font-medium transition-colors px-3 py-1.5 hover:bg-red-50 rounded-lg"
                      >
                        删除
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
        </div>

      <div v-if="rules.length === 0" class="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-lg">
        <div class="text-5xl mb-4">📋</div>
        暂无规则，点击"重置为默认"加载预设规则
      </div>
    </main>

    <!-- 确认弹窗 -->
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