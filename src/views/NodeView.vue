<script setup lang="ts">
import { useMindMapStore } from '../stores/mindMapStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  id: string
}>()

const store = useMindMapStore()
const router = useRouter()

const node = computed(() => store.nodes.find(n => n.id === Number(props.id)))

function openRelation() {
  const relation = store.relations.find(r => r.from === Number(props.id) || r.to === Number(props.id))
  if (relation) {
    router.push(`/relations/${relation.id}`)
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content small-modal">
      <h2>Редактирование ноды</h2>
      <div class="modal-field">
        <label>ID ноды:</label>
        <input type="text" :value="node?.id" disabled />
      </div>
      <div class="modal-field">
        <label>Текст ноды:</label>
        <input v-model="node!.text" type="text" />
      </div>
      <div class="modal-actions">
        <button @click="router.push('/')">Назад</button>
        <button @click="openRelation">Перейти к связи</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.small-modal {
  width: 400px;
  max-width: 90%;
}
</style> 