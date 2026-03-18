<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [name: string, studentNo: string]
}>()

const name = ref('')
const studentNo = ref('')

watch(() => props.show, (show) => {
  if (show) {
    name.value = ''
    studentNo.value = ''
  }
})

function submit() {
  if (!name.value.trim()) return
  emit('submit', name.value.trim(), studentNo.value.trim())
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">👨‍🎓</span> 添加学生
        </h3>
        <input
          v-model="name"
          type="text"
          placeholder="学生姓名"
          class="w-full border-2 border-gray-200 rounded-xl px-5 py-3 mb-4 text-lg focus:outline-none focus:border-orange-400 transition-colors"
        />
        <input
          v-model="studentNo"
          type="text"
          placeholder="学号（可选）"
          class="w-full border-2 border-gray-200 rounded-xl px-5 py-3 mb-6 focus:outline-none focus:border-orange-400 transition-colors"
        />
        <div class="flex gap-3 justify-end">
          <button @click="close" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
          <button @click="submit" class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
            添加
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
