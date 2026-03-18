import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import PetPreview from '@/pages/PetPreview.vue'
import Ranking from '@/pages/Ranking.vue'
import Rules from '@/pages/Rules.vue'
import Records from '@/pages/Records.vue'
import Students from '@/pages/Students.vue'

const router = createRouter({
  history: createWebHistory('/pet-garden/'),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/preview', name: 'preview', component: PetPreview },
    { path: '/ranking', name: 'ranking', component: Ranking },
    { path: '/rules', name: 'rules', component: Rules },
    { path: '/records', name: 'records', component: Records },
    { path: '/students', name: 'students', component: Students }
  ]
})

export default router