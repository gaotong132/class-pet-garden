import { ref, computed } from 'vue'
import type { Student } from '@/types'
import { calculateLevel } from '@/data/pets'

export function useStudents() {
  const students = ref<Student[]>([])
  const searchQuery = ref('')
  const sortBy = ref<'name' | 'studentNo' | 'progress'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  const filteredStudents = computed(() => {
    let result = [...students.value]
    if (searchQuery.value) {
      result = result.filter(s => s.name.includes(searchQuery.value))
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy.value) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'studentNo':
          const noA = a.student_no || ''
          const noB = b.student_no || ''
          comparison = noA.localeCompare(noB)
          break
        case 'progress':
          const levelA = a.pet_level || 0
          const levelB = b.pet_level || 0
          if (levelA !== levelB) {
            comparison = levelA - levelB
          } else {
            comparison = (a.pet_exp || 0) - (b.pet_exp || 0)
          }
          break
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  function setSort(by: 'name' | 'studentNo' | 'progress', order: 'asc' | 'desc') {
    sortBy.value = by
    sortOrder.value = order
  }

  function getDisplayLevel(student: Student): number {
    return calculateLevel(student.pet_exp)
  }

  return {
    students,
    searchQuery,
    sortBy,
    sortOrder,
    filteredStudents,
    setSort,
    getDisplayLevel
  }
}
