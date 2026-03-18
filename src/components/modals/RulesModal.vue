<script setup lang="ts">
import { ref } from 'vue'
import type { Rule } from '@/types'

defineProps<{
  show: boolean
  rules: Rule[]
}>()

const emit = defineEmits<{
  close: []
  addRule: [name: string, points: number, category: string]
  deleteRule: [id: string]
}>()

const categories = ['学习', '行为', '健康', '其他']
const newRuleName = ref('')
const newRulePoints = ref(1)
const newRuleCategory = ref('学习')

function addRule() {
  if (!newRuleName.value.trim()) return
  emit('addRule', newRuleName.value.trim(), newRulePoints.value, newRuleCategory.value)
  newRuleName.value = ''
  newRulePoints.value = 1
}

function deleteRule(id: string) {
  emit('deleteRule', id)
}

function close() {
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
            <span>➕</span> 添加自定义规则
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
          <button
            @click="addRule"
            class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            添加规则
          </button>
        </div>

        <!-- 规则列表 -->
        <div class="space-y-6">
          <template v-for="cat in categories" :key="cat">
            <div v-if="rules.filter(r => r.category === cat).length > 0">
              <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span>{{ cat === '学习' ? '📚' : cat === '行为' ? '🎯' : cat === '健康' ? '💪' : '📌' }}</span>
                {{ cat }}
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  v-for="rule in rules.filter(r => r.category === cat)"
                  :key="rule.id"
                  class="flex items-center justify-between p-4 rounded-xl border-2"
                  :class="rule.points > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
                >
                  <div class="flex items-center gap-2">
                    <span
                      class="font-bold text-lg"
                      :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                    >
                      {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                    </span>
                    <span class="text-sm font-medium">{{ rule.name }}</span>
                  </div>
                  <button
                    v-if="rule.is_custom"
                    @click="deleteRule(rule.id)"
                    class="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="close" class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>