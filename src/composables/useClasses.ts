import { ref } from 'vue'
import type { Class } from '@/types'
import { useAuth } from './useAuth'

const { api } = useAuth()

export function useClasses() {
  const classes = ref<Class[]>([])
  const currentClass = ref<Class | null>(null)

  async function loadClasses() {
    try {
      const res = await api.get('/classes')
      classes.value = res.data.classes
      if (classes.value.length > 0) {
        const savedClassId = localStorage.getItem('pet-garden-current-class')
        const savedClass = savedClassId ? classes.value.find(c => c.id === savedClassId) : null

        if (savedClass) {
          await selectClass(savedClass)
        } else if (!currentClass.value || !classes.value.find(c => c.id === currentClass.value?.id)) {
          await selectClass(classes.value[0])
        }
      } else {
        currentClass.value = null
      }
    } catch (error) {
      console.error('加载班级失败:', error)
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

  return {
    classes,
    currentClass,
    loadClasses,
    selectClass,
    createClass,
    updateClass,
    deleteClass
  }
}
