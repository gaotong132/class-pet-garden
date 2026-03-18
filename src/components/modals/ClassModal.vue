<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  editing?: { id: string; name: string } | null
}>()

const emit = defineEmits<{
  close: []
  submit: [name: string]
}>()

const name = ref('')

watch(() => props.show, (show) => {
  if (show) {
    name.value = props.editing?.name || ''
  }
})

function submit() {
  if (!name.value.trim()) return
  emit('submit', name.value.trim())
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
          <span class="text-2xl">🏫</span> {{ editing ? '编辑班级' : '创建班级' }}
        </h3>
        <input
          v-model="name"
          type="text"
          placeholder="输入班级名称..."
          class="w-full border-2 border-gray-200 rounded-xl px-5 py-3 mb-6 text-lg focus:outline-none focus:border-orange-400 transition-colors"
          @keyup.enter="submit"
        />
        <div class="flex gap-3 justify-end">
          <button @click="close" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
          <button @click="submit" class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
            {{ editing ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
