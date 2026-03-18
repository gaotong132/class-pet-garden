<script setup lang="ts">
import { ref, watch } from 'vue'
import { PET_TYPES, getPetLevel1Image } from '@/data/pets'
import type { Student } from '@/types'

const props = defineProps<{
  show: boolean
  student: Student | null
}>()

const emit = defineEmits<{
  close: []
  select: [petId: string]
}>()

const imageLoaded = ref<Record<string, boolean>>({})

watch(() => props.show, (show) => {
  if (show) {
    imageLoaded.value = {}
  }
})

function select(petId: string) {
  emit('select', petId)
}

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <span class="text-3xl">🐾</span>
          <span>为 <span class="text-gradient bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{{ student?.name }}</span> 选择宠物伙伴</span>
        </h3>

        <!-- 宠物网格 -->
        <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <button
            v-for="pet in PET_TYPES"
            :key="pet.id"
            @click="select(pet.id)"
            class="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-3 hover:shadow-xl hover:scale-105 transition-all text-center group border-2 border-transparent hover:border-orange-300 hover:from-orange-50 hover:to-pink-50 overflow-hidden"
          >
            <!-- 装饰性边框 -->
            <div class="absolute inset-0 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-orange-200 transition-colors"></div>

            <!-- 图片容器 -->
            <div class="relative w-full aspect-square mx-auto mb-2">
              <!-- 加载动画 -->
              <div
                v-if="!imageLoaded[pet.id]"
                class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100/80 to-pink-100/80 rounded-xl"
              >
                <div class="flex gap-1.5">
                  <span class="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
              <!-- 宠物图片 -->
              <img
                :src="getPetLevel1Image(pet.id)"
                class="w-full h-full object-contain group-hover:scale-110 transition-all duration-300 rounded-xl p-1"
                :class="imageLoaded[pet.id] ? 'opacity-100' : 'opacity-0'"
                @load="imageLoaded[pet.id] = true"
              />
            </div>

            <!-- 宠物名称 -->
            <div class="text-base font-bold mt-2 text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">{{ pet.name }}</div>
          </button>
        </div>

        <div class="mt-6 p-4 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 rounded-xl text-sm text-gray-600 text-center border border-orange-100">
          <span class="text-lg">💡</span> 点击宠物即可领养，宠物会陪伴学生一起成长！
        </div>

        <div class="flex justify-end mt-6">
          <button @click="close" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
