<script setup lang="ts">
import { ref } from 'vue'
import type { Rule } from '@/types'

const props = defineProps<{
  show: boolean
  rules: Rule[]
}>()

const emit = defineEmits<{
  close: []
  addRule: [name: string, points: number, category: string]
  updateRule: [id: string, name: string, points: number, category: string]
  deleteRule: [id: string]
  resetRules: []
}>()

const categories = ['学习', '行为', '健康', '其他']
const newRuleName = ref('')
const newRulePoints = ref(1)
const newRuleCategory = ref('学习')

// 编辑状态
const editingRule = ref<Rule | null>(null)
const editName = ref('')
const editPoints = ref(1)
const editCategory = ref('学习')

function addRule() {
  if (!newRuleName.value.trim()) return
  emit('addRule', newRuleName.value.trim(), newRulePoints.value, newRuleCategory.value)
  newRuleName.value = ''
  newRulePoints.value = 1
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

function saveEdit() {
  if (!editingRule.value || !editName.value.trim()) return
  emit('updateRule', editingRule.value.id, editName.value.trim(), editPoints.value, editCategory.value)
  editingRule.value = null
}

function deleteRule(id: string) {
  if (confirm('确定删除该规则？')) {
    emit('deleteRule', id)
  }
}

function resetRules() {
  if (confirm('确定重置为默认规则？当前所有规则将被删除，恢复为系统预设规则。')) {
    emit('resetRules')
  }
}

function close() {
  editingRule.value = null
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[85vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">⚙️</span> 管理评价规则
        </h3>

        <!-- 添加规则表单 -->
        <div class="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 mb-6">
          <h4 class="font-bold mb-4 flex items-center gap-2">
            <span>➕</span> 添加新规则
          </h4>
          <div class="flex flex-wrap gap-3 mb-4">
            <input
              v-model="newRuleName"
              type="text"
              placeholder="规则名称"
              class="flex-1 min-w-[200px] border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-400 transition-colors"
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
        <div class="space-y-6">
          <template v-for="cat in categories" :key="cat">
            <div v-if="rules.filter(r => r.category === cat).length > 0">
              <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span>{{ cat === '学习' ? '📚' : cat === '行为' ? '🎯' : cat === '健康' ? '💪' : '📌' }}</span>
                {{ cat }}
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="rule in rules.filter(r => r.category === cat)"
                  :key="rule.id"
                  class="flex items-center justify-between p-4 rounded-xl border-2"
                  :class="rule.points > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                >
                  <!-- 编辑模式 -->
                  <template v-if="editingRule?.id === rule.id">
                    <div class="flex flex-wrap gap-2 flex-1">
                      <input
                        v-model="editName"
                        type="text"
                        class="flex-1 min-w-[120px] border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400"
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
                    <div class="flex gap-1 ml-2">
                      <button @click="saveEdit" class="text-green-600 hover:text-green-700 px-2 py-1 font-medium text-sm">保存</button>
                      <button @click="cancelEdit" class="text-gray-500 hover:text-gray-700 px-2 py-1 font-medium text-sm">取消</button>
                    </div>
                  </template>
                  
                  <!-- 显示模式 -->
                  <template v-else>
                    <div class="flex items-center gap-2">
                      <span
                        class="font-bold text-lg"
                        :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                      >
                        {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                      </span>
                      <span class="text-sm font-medium">{{ rule.name }}</span>
                    </div>
                    <div class="flex gap-1">
                      <button
                        @click="startEdit(rule)"
                        class="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors px-2 py-1"
                      >
                        编辑
                      </button>
                      <button
                        @click="deleteRule(rule.id)"
                        class="text-red-400 hover:text-red-600 text-sm font-medium transition-colors px-2 py-1"
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
        
        <div v-if="rules.length === 0" class="text-center py-12 text-gray-500">
          暂无规则，点击"重置为默认"加载预设规则
        </div>

        <div class="flex justify-end mt-6">
          <button @click="close" class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>