<script setup lang="ts">
import { useMindMapStore } from '../stores/mindMapStore'
import { onMounted, ref, watch } from 'vue'
import { getFromDB, saveToDB } from '../stores/db'
import { useRouter } from 'vue-router'

const store = useMindMapStore()
const selectedNodeId = ref<number | null>(null)
const isDragging = ref(false)
const scale = ref(1)
const offset = ref({ x: 0, y: 0 })
const startPan = ref({ x: 0, y: 0 })
const isPanning = ref(false)

const router = useRouter()

// Добавляем реактивное состояние для темы
const isDarkTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// Следим за изменениями системной темы
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  isDarkTheme.value = event.matches
})

onMounted(async () => {
  try {
    // Загружаем данные из IndexedDB
    const [nodes, relations] = await Promise.all([
      getFromDB('nodes'),
      getFromDB('relations')
    ])
    
    // Проверяем, что данные существуют
    if (nodes && relations) {
      store.nodes = nodes
      store.relations = relations
    } else {
      // Если данных нет, загружаем начальные
      await store.loadData()
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных из IndexedDB:', error)
    await store.loadData() // Загружаем начальные данные, если IndexedDB пуст
  }
})

watch(
  () => [store.nodes, store.relations],
  async () => {
    try {
      // Проверяем, что данные существуют
      if (store.nodes.length > 0 || store.relations.length > 0) {
        // Создаем простые объекты для сохранения
        const nodesToSave = store.nodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          text: node.text
        }))
        const relationsToSave = store.relations.map(relation => ({
          id: relation.id,
          from: relation.from,
          to: relation.to,
          label: relation.label,
          color: relation.color
        }))
        
        // Сохраняем данные в IndexedDB
        await Promise.all([
          saveToDB('nodes', nodesToSave),
          saveToDB('relations', relationsToSave)
        ])
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных в IndexedDB:', error)
    }
  },
  { deep: true }
)

function addNode() {
  const node = {
    id: Date.now(),
    x: 100,
    y: 100,
    text: 'New Node'
  }
  store.addNode(node)
}

function selectNode(id: number, event?: MouseEvent) {
  if (selectedNodeId.value !== null && event?.shiftKey) {
    // Если уже есть выделенная нода и нажат SHIFT, создаем связь
    startRelation(selectedNodeId.value, id)
  } else {
    // Иначе просто выделяем ноду
    selectedNodeId.value = id
  }
}

function startDrag(event: MouseEvent, nodeId: number) {
  event.stopPropagation() // Предотвращаем начало панорамирования
  isDragging.value = true
  selectNode(nodeId)
}

function onDrag(event: MouseEvent) {
  if (isDragging.value && selectedNodeId.value !== null) {
    const node = store.nodes.find(n => n.id === selectedNodeId.value)
    if (node) {
      // Учитываем масштаб и смещение при расчете позиции
      const x = (event.offsetX - offset.value.x) / scale.value
      const y = (event.offsetY - offset.value.y) / scale.value
      node.x = x - 50 // Центрируем ноду относительно курсора
      node.y = y - 25
    }
  }
}

function stopDrag() {
  isDragging.value = false
}

function startPanning(event: MouseEvent) {
  if (event.button === 1 || (event.button === 0 && event.ctrlKey)) { // Средняя кнопка мыши или Ctrl + ЛКМ
    isPanning.value = true
    startPan.value = { x: event.clientX - offset.value.x, y: event.clientY - offset.value.y }
  }
}

function onPan(event: MouseEvent) {
  if (isPanning.value) {
    offset.value = {
      x: event.clientX - startPan.value.x,
      y: event.clientY - startPan.value.y
    }
  } else if (isDragging.value) {
    onDrag(event)
  }
}

function stopPanning() {
  isPanning.value = false
  stopDrag() // Останавливаем перемещение ноды при завершении панорамирования
}

function handleMouseUp() {
  stopPanning()
  stopDrag()
}

function handleMouseLeave() {
  stopPanning()
  stopDrag()
}

function zoom(event: WheelEvent) {
  event.preventDefault()
  const zoomFactor = 0.1
  const newScale = event.deltaY < 0 ? scale.value * (1 + zoomFactor) : scale.value * (1 - zoomFactor)
  scale.value = Math.min(Math.max(0.5, newScale), 3)
}

function startRelation(fromNodeId: number, toNodeId: number) {
  const existingRelation = store.relations.find(
    r => (r.from === fromNodeId && r.to === toNodeId) || 
         (r.from === toNodeId && r.to === fromNodeId)
  )

  if (!existingRelation) {
    const newRelation = {
      id: Date.now(),
      from: fromNodeId,
      to: toNodeId,
      label: 'New Relation',
      color: '#000000'
    }
    store.addRelation(newRelation)
  }
  selectedNodeId.value = null
}

function getRelationPath(fromNode: any, toNode: any) {
  const x1 = fromNode.x + 50
  const y1 = fromNode.y + 25
  const x2 = toNode.x + 50
  const y2 = toNode.y + 25
  
  return `M${x1},${y1} C${x1 + 100},${y1} ${x2 - 100},${y2} ${x2},${y2}`
}

function openNodeModal(nodeId: number) {
  router.push(`/nodes/${nodeId}`)
}

function selectRelation(relationId: number) {
  // Логика обработки выбора связи
  console.log('Selected relation:', relationId)
}
</script>

<template>
  <div 
    class="mind-map-container"
    :class="{ 'dark-theme': isDarkTheme }"
    @wheel="zoom"
    @mousedown="startPanning"
    @mousemove="onPan"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
  >
    <svg 
      class="mind-map" 
      :style="{ 
        transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
        transformOrigin: '0 0'
      }"
      width="2000" 
      height="2000"
    >
      <!-- Отображение связей -->
      <g v-for="relation in store.relations" :key="relation.id">
        <path
          :d="getRelationPath(
            store.nodes.find(n => n.id === relation.from),
            store.nodes.find(n => n.id === relation.to)
          )"
          :stroke="relation.color || '#000000'"
          stroke-width="2"
          fill="none"
          @click="selectRelation(relation.id)"
          class="relation-path"
        />
        <text
          :x="(store.nodes.find(n => n.id === relation.from).x + store.nodes.find(n => n.id === relation.to).x) / 2 + 50"
          :y="(store.nodes.find(n => n.id === relation.from).y + store.nodes.find(n => n.id === relation.to).y) / 2 + 25"
          text-anchor="middle"
          @click="selectRelation(relation.id)"
          class="relation-label"
        >
          {{ relation.label }}
        </text>
      </g>

      <!-- Отображение нод -->
      <g v-for="node in store.nodes" :key="node.id">
        <rect
          :x="node.x"
          :y="node.y"
          width="100"
          height="50"
          :fill="selectedNodeId === node.id ? 'lightgreen' : 'lightblue'"
          stroke="black"
          @mousedown.stop="(event) => startDrag(event, node.id)"
          @click.stop="(event) => selectNode(node.id, event)"
          @dblclick.stop="openNodeModal(node.id)"
        />
        <text 
          :x="node.x + 10" 
          :y="node.y + 30"
          pointer-events="none"
        >
          {{ node.text }}
        </text>
      </g>
    </svg>
    <button class="add-button" @click="addNode">+</button>
  </div>
</template>

<style scoped>
/* Общие стили для светлой темы */
.mind-map-container {
  background-color: #ffffff;
  color: #000000;
  width: 100%;
  height: 100vh;
  overflow: auto;
  position: relative;
}

/* Стили для темной темы */
.dark-theme {
  background-color: #1e1e1e;
  color: #ffffff;
}

.dark-theme .mind-map {
  background-color: #2d2d2d;
}

.dark-theme .modal-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

.dark-theme .modal-content {
  background-color: #2d2d2d;
  color: #ffffff;
}

.dark-theme .modal-field input {
  background-color: #3d3d3d;
  color: #ffffff;
  border-color: #4d4d4d;
}

.dark-theme .modal-actions button:first-child {
  background-color: #1a73e8;
}

.dark-theme .modal-actions button:last-child {
  background-color: #3d3d3d;
  color: #ffffff;
}

.dark-theme .linked-nodes button {
  background-color: #3d3d3d;
  color: #ffffff;
  border-color: #4d4d4d;
}

.mind-map {
  transition: transform 0.1s ease;
}

.add-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #2196F3;
  color: white;
  font-size: 24px;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-button:hover {
  background-color: #1976D2;
}

.relation-path {
  cursor: pointer;
  transition: stroke-width 0.2s ease;
}

.relation-path:hover {
  stroke-width: 4;
}

.relation-label {
  cursor: pointer;
  font-size: 12px;
  fill: #000;
  user-select: none;
}

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
  z-index: 1001;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-field {
  margin-bottom: 15px;
}

.modal-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.modal-field input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.modal-actions button:first-child {
  background-color: #2196F3;
  color: white;
}

.modal-actions button:first-child:hover {
  background-color: #1976D2;
}

.modal-actions button:last-child {
  background-color: #f5f5f5;
}

.modal-actions button:last-child:hover {
  background-color: #e0e0e0;
}

.modal-actions button:nth-child(2) {
  background-color: #4caf50;
  color: white;
}

.modal-actions button:nth-child(2):hover {
  background-color: #45a049;
}

.linked-nodes {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.linked-nodes button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.linked-nodes button:hover {
  background-color: #e0e0e0;
}
</style> 