<script setup lang="ts">
import { useMindMapStore } from '../stores/mindMapStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  id: string
}>()

const store = useMindMapStore()
const router = useRouter()

const relation = computed(() => store.relations.find(r => r.id === Number(props.id)))

function openNode(nodeId: number) {
  router.push(`/nodes/${nodeId}`)
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content small-modal">
      <h2>Редактирование связи</h2>
      <div class="modal-field">
        <label>ID связи:</label>
        <input type="text" :value="relation?.id" disabled />
      </div>
      <div class="modal-field">
        <label>Название:</label>
        <input v-model="relation!.label" type="text" />
      </div>
      <div class="modal-field">
        <label>Цвет:</label>
        <input v-model="relation!.color" type="color" />
      </div>
      <div class="modal-field">
        <label>Связанные ноды:</label>
        <div class="linked-nodes">
          <button @click="openNode(relation!.from)">
            Нода {{ relation!.from }}
          </button>
          <button @click="openNode(relation!.to)">
            Нода {{ relation!.to }}
          </button>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="router.push('/')">Назад</button>
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