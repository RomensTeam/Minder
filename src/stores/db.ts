export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MindMapDB', 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('nodes')) {
        db.createObjectStore('nodes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('relations')) {
        db.createObjectStore('relations', { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export const saveToDB = async (storeName: string, data: any[]): Promise<void> => {
  const db = await openDB()
  const transaction = db.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  
  return new Promise((resolve, reject) => {
    // Очищаем хранилище перед добавлением новых данных
    const clearRequest = store.clear()
    
    clearRequest.onsuccess = () => {
      // Добавляем каждый элемент по отдельности
      const putPromises = data.map(item => {
        // Создаем простой объект без методов и циклических ссылок
        const simpleItem = {
          id: item.id,
          x: item.x,
          y: item.y,
          text: item.text,
          from: item.from,
          to: item.to,
          label: item.label,
          color: item.color
        }
        return new Promise((resolve, reject) => {
          const request = store.put(simpleItem)
          request.onsuccess = () => resolve(null)
          request.onerror = () => reject(request.error)
        })
      })
      
      Promise.all(putPromises)
        .then(() => resolve())
        .catch(error => reject(error))
    }
    
    clearRequest.onerror = () => reject(clearRequest.error)
  })
}

export const getFromDB = async (storeName: string): Promise<any[]> => {
  const db = await openDB()
  const transaction = db.transaction(storeName, 'readonly')
  const store = transaction.objectStore(storeName)
  const request = store.getAll()
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
} 