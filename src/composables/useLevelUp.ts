import { ref } from 'vue'
import { getPetLevelImage } from '@/data/pets'

interface LevelUpInfo {
  name: string
  level: number
  petType: string
  prevLevel: number
}

export function useLevelUp() {
  const showLevelUpAnimation = ref(false)
  const levelUpInfo = ref<LevelUpInfo>({ name: '', level: 0, petType: '', prevLevel: 0 })
  const levelUpPhase = ref<'show-prev' | 'transition' | 'show-current'>('show-prev')

  function triggerLevelUp(name: string, level: number, petType: string, prevLevel: number) {
    levelUpInfo.value = { name, level, petType, prevLevel }
    levelUpPhase.value = 'show-prev'
    showLevelUpAnimation.value = true

    // 动画时序控制
    setTimeout(() => { levelUpPhase.value = 'transition' }, 500)
    setTimeout(() => { levelUpPhase.value = 'show-current' }, 1500)
    setTimeout(() => { showLevelUpAnimation.value = false }, 4000)
  }

  function getLevelUpImage(phase: 'prev' | 'current') {
    if (!levelUpInfo.value.petType) return ''
    const level = phase === 'prev' ? levelUpInfo.value.prevLevel : levelUpInfo.value.level
    return getPetLevelImage(levelUpInfo.value.petType, level)
  }

  return {
    showLevelUpAnimation,
    levelUpInfo,
    levelUpPhase,
    triggerLevelUp,
    getLevelUpImage
  }
}
