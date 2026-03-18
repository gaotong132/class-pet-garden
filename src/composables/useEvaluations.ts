import { ref, computed } from 'vue'
import type { Rule, EvaluationRecord } from '@/types'
import { useAuth } from './useAuth'

const { api } = useAuth()

export function useEvaluations() {
  const rules = ref<Rule[]>([])
  const evaluationRecords = ref<EvaluationRecord[]>([])
  const recordsPage = ref(1)
  const recordsPageSize = 20
  const totalRecords = ref(0)

  const categories = ['学习', '行为', '健康', '其他']

  const totalPages = computed(() => {
    return Math.ceil(totalRecords.value / recordsPageSize)
  })

  const paginatedRecords = computed(() => {
    return evaluationRecords.value
  })

  async function loadRules() {
    const res = await api.get('/rules')
    rules.value = res.data.rules
  }

  async function addRule(name: string, points: number, category: string) {
    await api.post('/rules', { name, points, category })
    await loadRules()
  }

  async function deleteRule(id: string) {
    await api.delete(`/rules/${id}`)
    await loadRules()
  }

  async function loadEvaluationRecords(classId: string) {
    const res = await api.get(`/evaluations?classId=${classId}&page=${recordsPage.value}&pageSize=${recordsPageSize}`)
    evaluationRecords.value = res.data.records
    totalRecords.value = res.data.total
  }

  async function evaluate(classId: string, studentId: string, rule: Rule) {
    const res = await api.post('/evaluations', {
      classId,
      studentId,
      points: rule.points,
      reason: rule.name,
      category: rule.category
    })
    return res.data
  }

  async function undoLastEvaluation(classId: string, recordId?: string) {
    if (recordId) {
      await api.delete(`/evaluations/${recordId}`)
    } else {
      await api.delete(`/evaluations/latest?classId=${classId}`)
    }
  }

  function prevPage() {
    if (recordsPage.value > 1) {
      recordsPage.value--
    }
  }

  function nextPage() {
    if (recordsPage.value < totalPages.value) {
      recordsPage.value++
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      recordsPage.value = page
    }
  }

  return {
    rules,
    categories,
    evaluationRecords,
    recordsPage,
    recordsPageSize,
    totalRecords,
    totalPages,
    paginatedRecords,
    loadRules,
    addRule,
    deleteRule,
    loadEvaluationRecords,
    evaluate,
    undoLastEvaluation,
    prevPage,
    nextPage,
    goToPage
  }
}
