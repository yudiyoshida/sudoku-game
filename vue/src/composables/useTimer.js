import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const seconds = ref(0)
  let intervalId = null

  const formatted = computed(() => formatTime(seconds.value))

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function start(shouldTick) {
    stop()
    seconds.value = 0
    intervalId = setInterval(() => {
      if (shouldTick()) seconds.value++
    }, 1000)
  }

  onUnmounted(stop)

  return { seconds, formatted, start, stop, formatTime }
}
