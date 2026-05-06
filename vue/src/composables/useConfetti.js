import { ref, onMounted, onUnmounted } from 'vue'

export function useConfetti() {
  const canvasRef = ref(null)
  let animId = null
  let particles = []

  function resize() {
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  function animate() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.rotation += p.rotSpeed
      if (p.y > canvas.height + 20) {
        p.opacity -= 0.02
      }
      if (p.opacity <= 0) continue
      alive = true
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (alive) {
      animId = requestAnimationFrame(animate)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animId = null
    }
  }

  function launch() {
    const canvas = canvasRef.value
    if (!canvas) return
    resize()
    const colors = ['#E8A838', '#5CB85C', '#3ECFB2', '#E85454', '#F5F0E8', '#D4943A', '#7EC8E3']
    particles = []
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      })
    }
    if (animId) cancelAnimationFrame(animId)
    animate()
  }

  onMounted(() => {
    window.addEventListener('resize', resize)
    resize()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
    if (animId) cancelAnimationFrame(animId)
  })

  return { canvasRef, launch }
}
