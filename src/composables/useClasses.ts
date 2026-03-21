import { ref } from 'vue'
import type { Class } from '@/types'
import { useAuth } from './useAuth'

// 模块级别的全局状态（单例）
const classes = ref<Class[]>([])
const currentClass = ref<Class | null>(null)
const isLoading = ref(false)
let initialized = false

export function useClasses() {
  const { api } = useAuth()

  async function loadClasses() {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const res = await api.get('/classes')
      classes.value = res.data.classes
      if (classes.value.length > 0) {
        const savedClassId = localStorage.getItem('pet-garden-current-class')
        const savedClass = savedClassId ? classes.value.find(c => c.id === savedClassId) : null

        if (savedClass) {
          currentClass.value = savedClass
        } else if (!currentClass.value || !classes.value.find(c => c.id === currentClass.value?.id)) {
          currentClass.value = classes.value[0]
          if (currentClass.value) {
            localStorage.setItem('pet-garden-current-class', currentClass.value.id)
          }
        }
      } else {
        currentClass.value = null
      }
    } catch (error) {
      console.error('加载班级失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function selectClass(cls: Class) {
    currentClass.value = cls
    localStorage.setItem('pet-garden-current-class', cls.id)
  }

  async function createClass(name: string) {
    const res = await api.post('/classes', { name })
    await loadClasses()
    return res.data
  }

  async function updateClass(id: string, name: string) {
    await api.put(`/classes/${id}`, { name })
    if (currentClass.value?.id === id) {
      currentClass.value = { ...currentClass.value, name }
    }
    await loadClasses()
  }

  async function deleteClass(id: string) {
    await api.delete(`/classes/${id}`)
    if (currentClass.value?.id === id) {
      currentClass.value = null
    }
    await loadClasses()
  }

  // 同步检查（用于 onActivated）
  function syncCurrentClass() {
    const savedClassId = localStorage.getItem('pet-garden-current-class')
    if (savedClassId && savedClassId !== currentClass.value?.id) {
      currentClass.value = classes.value.find(c => c.id === savedClassId) || classes.value[0] || null
    }
  }

  // 初始化（只执行一次）
  async function init() {
    if (!initialized) {
      initialized = true
      await loadClasses()
    }
  }

  return {
    classes,
    currentClass,
    isLoading,
    loadClasses,
    selectClass,
    createClass,
    updateClass,
    deleteClass,
    syncCurrentClass,
    init
  }
}