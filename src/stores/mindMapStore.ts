import { defineStore } from 'pinia'
import { ref } from 'vue'
import { openDB } from 'idb'

interface Relation {
  id: number
  from: number
  to: number
  label?: string
  color?: string
}

export const useMindMapStore = defineStore('mindMap', () => {
  const nodes = ref<any[]>([])
  const relations = ref<any[]>([])

  async function initDB() {
    const db = await openDB('mindMapDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('nodes')) {
          db.createObjectStore('nodes', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('relations')) {
          db.createObjectStore('relations', { keyPath: 'id' })
        }
      }
    })
    return db
  }

  async function loadData() {
    const db = await initDB()
    
    // Загружаем ноды
    const savedNodes = await db.getAll('nodes')
    if (savedNodes) {
      nodes.value = savedNodes
    }
    
    // Загружаем связи
    const savedRelations = await db.getAll('relations')
    if (savedRelations) {
      relations.value = savedRelations
    }
  }

  async function addNode(node: any) {
    const db = await initDB()
    await db.add('nodes', node)
    nodes.value.push(node)
  }

  async function addRelation(relation: any) {
    const db = await initDB()
    await db.add('relations', relation)
    relations.value.push(relation)
  }

  async function updateRelation(relation: Relation) {
    const index = relations.value.findIndex(r => r.id === relation.id)
    if (index !== -1) {
      relations.value[index] = {
        id: relation.id,
        from: relation.from,
        to: relation.to,
        label: relation.label,
        color: relation.color
      }
    }
  }

  return {
    nodes,
    relations,
    loadData,
    addNode,
    addRelation,
    updateRelation
  }
}) 