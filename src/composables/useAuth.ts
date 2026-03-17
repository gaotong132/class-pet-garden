import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  id: string
  username: string
  isGuest: boolean
}

const user = ref<User | null>(null)
const token = ref<string>(localStorage.getItem('token') || '')

// 初始化用户状态
const savedUser = localStorage.getItem('user')
if (savedUser) {
  try {
    user.value = JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
}

// 创建带认证的 axios 实例
export function useAuth() {
  const api = axios.create({
    baseURL: 'http://localhost:3002'
  })
  
  // 添加请求拦截器
  api.interceptors.request.use((config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`
    }
    return config
  })
  
  const isLoggedIn = computed(() => !!user.value)
  const isGuest = computed(() => user.value?.isGuest ?? true)
  const username = computed(() => user.value?.username || '游客')
  
  function setUser(userData: User, userToken: string) {
    user.value = userData
    token.value = userToken
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  async function fetchUserInfo() {
    try {
      const res = await api.get('/api/auth/me')
      user.value = res.data.user
    } catch {
      // Token 无效，清除登录状态
      logout()
    }
  }
  
  return {
    user,
    token,
    isLoggedIn,
    isGuest,
    username,
    api,
    setUser,
    logout,
    fetchUserInfo
  }
}
