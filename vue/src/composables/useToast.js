import { ref } from 'vue'

export function useToast() {
  const toasts = ref([])

  function show(message, type = '') {
    const id = crypto.randomUUID()
    toasts.value = [...toasts.value, { id, message, type, out: false }]
    setTimeout(() => {
      const t = toasts.value.find((x) => x.id === id)
      if (t) t.out = true
      setTimeout(() => {
        toasts.value = toasts.value.filter((x) => x.id !== id)
      }, 300)
    }, 2000)
  }

  return { toasts, show }
}
