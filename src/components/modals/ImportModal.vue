<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [text: string]
}>()

const importText = ref('')

watch(() => props.show, (show) => {
  if (show) {
    importText.value = ''
  }
})

function submit() {
  if (!importText.value.trim()) return
  emit('submit', importText.value.trim())
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
          <span class="text-2xl">📥</span> 批量导入学生
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          一行一个学生，姓名和学号用空格、逗号、Tab或分号分隔
        </p>
        <textarea
          v-model="importText"
          placeholder="张三 20240001&#10;李四, 20240002&#10;王五；20240003"
          class="w-full border-2 border-gray-200 rounded-xl px-5 py-4 mb-4 h-48 text-sm font-mono focus:outline-none focus:border-orange-400 transition-colors"
        ></textarea>
        <div class="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
          <p class="font-medium mb-2 flex items-center gap-2"><span>💡</span> 示例格式：</p>
          <code class="text-xs bg-white px-3 py-2 rounded-lg block text-gray-500">
            张三 20240001<br>
            李四,20240002<br>
            王五；20240003
          </code>
        </div>
        <div class="flex gap-3 justify-end">
          <button @click="close" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
          <button @click="submit" class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
            导入
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
