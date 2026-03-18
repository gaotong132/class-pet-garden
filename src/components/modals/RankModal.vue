<script setup lang="ts">
import { computed } from 'vue'
import type { Student } from '@/types'
import { getPetLevelImage, calculateLevel } from '@/data/pets'

const props = defineProps<{
  show: boolean
  students: Student[]
}>()

defineEmits<{
  close: []
}>()

function getStudentPetImage(student: Student): string {
  if (!student.pet_type) return ''
  return getPetLevelImage(student.pet_type, student.pet_level)
}

function getDisplayLevel(student: Student): number {
  return calculateLevel(student.pet_exp)
}

// 按积分排序
const ranking = computed(() => {
  return [...props.students].sort((a, b) => b.total_points - a.total_points)
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[85vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">🏆</span> 积分排行榜
        </h3>

        <div v-if="ranking.length === 0" class="text-center py-12 text-gray-500">
          暂无数据
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(student, index) in ranking"
            :key="student.id"
            class="flex items-center gap-4 p-4 rounded-2xl transition-all"
            :class="index < 3 ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 shadow-md' : 'bg-gray-50'"
          >
            <!-- 排名 -->
            <div class="w-10 h-10 flex items-center justify-center font-bold text-2xl">
              <span v-if="index === 0" class="text-3xl animate-bounce-slow">🥇</span>
              <span v-else-if="index === 1" class="text-3xl">🥈</span>
              <span v-else-if="index === 2" class="text-3xl">🥉</span>
              <span v-else class="text-gray-400">{{ index + 1 }}</span>
            </div>

            <!-- 宠物头像 -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 shadow-inner">
              <img
                v-if="student.pet_type"
                :src="getStudentPetImage(student)"
                class="w-10 h-10 object-contain"
              />
              <span v-else class="text-2xl">❓</span>
            </div>

            <!-- 信息 -->
            <div class="flex-1">
              <div class="font-bold text-gray-800">{{ student.name }}</div>
              <div class="text-xs text-gray-500">Lv.{{ getDisplayLevel(student) }}</div>
            </div>

            <!-- 积分 -->
            <div class="text-right">
              <div class="font-bold text-xl text-orange-500">+{{ student.total_points }}</div>
              <div class="text-xs text-gray-400">积分</div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="$emit('close')" class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>