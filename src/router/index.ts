import { createRouter, createWebHistory } from 'vue-router'
import MindMapEditor from '../components/MindMapEditor.vue'
import NodeView from '@/views/NodeView.vue'
import RelationView from '@/views/RelationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MindMapEditor
    },
    {
      path: '/nodes/:id',
      component: NodeView,
      props: true
    },
    {
      path: '/relations/:id',
      component: RelationView,
      props: true
    }
  ]
})

export default router 