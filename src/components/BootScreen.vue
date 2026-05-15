<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'

const emit = defineEmits<{
  (event: 'start'): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isStarting = ref(false)

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let frameId = 0
let trayGroup: Group | null = null
let foods: Sprite[] = []
let startedAt = 0

function createBox(width: number, height: number, depth: number, color: number, opacity = 1) {
  const material = new MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness: 0.48,
    metalness: 0.14,
  })

  return new Mesh(new BoxGeometry(width, height, depth), material)
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function createFoodTexture(label: 'rice' | 'egg' | 'tea' | 'fish' | 'bean') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return new CanvasTexture(canvas)
  }

  ctx.clearRect(0, 0, 256, 256)

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.34)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 10
  drawRoundRect(ctx, 38, 30, 180, 188, 28)
  ctx.fillStyle = 'rgba(247, 255, 243, 0.88)'
  ctx.fill()
  ctx.restore()

  if (label === 'rice') {
    ctx.fillStyle = '#f7fff3'
    ctx.beginPath()
    ctx.moveTo(128, 46)
    ctx.lineTo(210, 176)
    ctx.quadraticCurveTo(128, 220, 46, 176)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#dbe9dd'
    ctx.lineWidth = 8
    ctx.stroke()
    drawRoundRect(ctx, 104, 132, 48, 60, 8)
    ctx.fillStyle = '#24323a'
    ctx.fill()
  }

  if (label === 'egg') {
    drawRoundRect(ctx, 54, 84, 148, 82, 22)
    ctx.fillStyle = '#ffce54'
    ctx.fill()
    ctx.strokeStyle = '#f2a92e'
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.fillStyle = '#fff8cf'
    drawRoundRect(ctx, 54, 108, 148, 16, 8)
    ctx.fill()
  }

  if (label === 'tea') {
    drawRoundRect(ctx, 78, 70, 100, 126, 20)
    ctx.fillStyle = '#ff8066'
    ctx.fill()
    ctx.fillStyle = '#fff8cf'
    drawRoundRect(ctx, 68, 58, 120, 22, 10)
    ctx.fill()
    ctx.strokeStyle = '#24323a'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(150, 42)
    ctx.lineTo(138, 72)
    ctx.stroke()
  }

  if (label === 'fish') {
    drawRoundRect(ctx, 54, 82, 148, 92, 28)
    ctx.fillStyle = '#ff9f6e'
    ctx.fill()
    ctx.strokeStyle = '#f1665c'
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.strokeStyle = '#fff8cf'
    ctx.lineWidth = 10
    ;[88, 124, 160].forEach((x) => {
      ctx.beginPath()
      ctx.moveTo(x, 88)
      ctx.lineTo(x - 22, 168)
      ctx.stroke()
    })
  }

  if (label === 'bean') {
    drawRoundRect(ctx, 56, 92, 144, 64, 32)
    ctx.fillStyle = '#84f6b7'
    ctx.fill()
    ctx.strokeStyle = '#34c979'
    ctx.lineWidth = 7
    ctx.stroke()
    ctx.fillStyle = '#3aaa6a'
    ;[88, 128, 168].forEach((x) => {
      ctx.beginPath()
      ctx.arc(x, 124, 12, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const textMap = {
    rice: '飯糰',
    egg: '玉子',
    tea: '飲料',
    fish: '鮭魚',
    bean: '毛豆',
  }
  drawRoundRect(ctx, 70, 195, 116, 38, 16)
  ctx.fillStyle = 'rgba(10, 24, 28, 0.92)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(118, 243, 178, 0.5)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.font = '800 27px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f6fff8'
  ctx.fillText(textMap[label], 128, 214)

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

function createFood(label: 'rice' | 'egg' | 'tea' | 'fish' | 'bean') {
  const texture = createFoodTexture(label)
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
  })
  const food = new Sprite(material)
  food.scale.set(1.22, 1.22, 1)

  return food
}

function buildScene() {
  if (!canvasRef.value) {
    return
  }

  scene = new Scene()
  camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 5.15, 6.85)
  camera.lookAt(0, -0.08, 0)

  renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvasRef.value,
    preserveDrawingBuffer: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = SRGBColorSpace

  const ambientLight = new AmbientLight(0xdfffea, 1.35)
  scene.add(ambientLight)

  const keyLight = new DirectionalLight(0xffd66e, 2.2)
  keyLight.position.set(4, 6, 6)
  scene.add(keyLight)

  const rimLight = new PointLight(0x76f3b2, 4.8, 18)
  rimLight.position.set(-4, 1.5, 5)
  scene.add(rimLight)

  trayGroup = new Group()
  trayGroup.rotation.x = -0.08
  trayGroup.rotation.y = 0.12
  trayGroup.scale.setScalar(0.88)
  scene.add(trayGroup)

  const tray = createBox(5.92, 0.36, 3.78, 0x0b1f21, 0.98)
  tray.position.y = -0.7
  trayGroup.add(tray)

  const traySurface = createBox(5.5, 0.1, 3.34, 0x123537, 0.96)
  traySurface.position.y = -0.46
  trayGroup.add(traySurface)

  const lid = createBox(5.28, 0.12, 0.74, 0x102f30, 0.72)
  lid.position.set(0, -0.4, -2.12)
  trayGroup.add(lid)

  const rimMaterial = new MeshStandardMaterial({
    color: 0x76f3b2,
    emissive: 0x76f3b2,
    emissiveIntensity: 0.88,
    transparent: true,
    opacity: 0.42,
    roughness: 0.35,
  })

  const rimBars = [
    { size: [5.98, 0.12, 0.14], position: [0, -0.25, -1.88] },
    { size: [5.98, 0.12, 0.14], position: [0, -0.25, 1.88] },
    { size: [0.14, 0.12, 3.66], position: [-2.98, -0.25, 0] },
    { size: [0.14, 0.12, 3.66], position: [2.98, -0.25, 0] },
  ] as const

  rimBars.forEach((bar) => {
    const rim = new Mesh(new BoxGeometry(bar.size[0], bar.size[1], bar.size[2]), rimMaterial)
    rim.position.set(bar.position[0], bar.position[1], bar.position[2])
    trayGroup?.add(rim)
  })

  const slotWellMaterial = new MeshStandardMaterial({
    color: 0x071214,
    transparent: true,
    opacity: 0.8,
    roughness: 0.5,
  })
  const slotMaterial = new MeshStandardMaterial({
    color: 0xfff2c2,
    emissive: 0x6a4d12,
    emissiveIntensity: 0.28,
    roughness: 0.42,
  })
  const slotGlowMaterial = new MeshStandardMaterial({
    color: 0x76f3b2,
    emissive: 0x76f3b2,
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.22,
    roughness: 0.32,
  })
  const compartmentCenters: Vector3[] = []

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const center = new Vector3((col - 1) * 1.7, -0.28, (row - 0.5) * 1.24)
      compartmentCenters.push(center)

      const well = new Mesh(new BoxGeometry(1.58, 0.08, 1.1), slotWellMaterial)
      well.position.set(center.x, center.y - 0.04, center.z)
      trayGroup.add(well)

      const glow = new Mesh(new BoxGeometry(1.48, 0.05, 1), slotGlowMaterial)
      glow.position.set(center.x, center.y + 0.02, center.z)
      trayGroup.add(glow)

      const slot = new Mesh(new BoxGeometry(1.34, 0.06, 0.88), slotMaterial)
      slot.position.set(center.x, center.y + 0.06, center.z)
      trayGroup.add(slot)
    }
  }

  const chopstickMaterial = new MeshStandardMaterial({
    color: 0xffdc78,
    emissive: 0xffce54,
    emissiveIntensity: 0.48,
    transparent: true,
    opacity: 0.86,
    roughness: 0.28,
  })
  ;[-0.08, 0.08].forEach((offset) => {
    const chopstick = new Mesh(new BoxGeometry(2.36, 0.045, 0.055), chopstickMaterial)
    chopstick.position.set(2.08, -0.18, -1.76 + offset)
    chopstick.rotation.y = -0.2
    trayGroup?.add(chopstick)
  })

  const foodSpecs = [
    { label: 'rice' as const, targetIndex: 0, floatY: 1.22 },
    { label: 'fish' as const, targetIndex: 1, floatY: 1.48 },
    { label: 'bean' as const, targetIndex: 2, floatY: 1.22 },
    { label: 'egg' as const, targetIndex: 3, floatY: 0.92 },
    { label: 'tea' as const, targetIndex: 4, floatY: 1.06 },
  ]

  foods = foodSpecs.map((spec, index) => {
    const food = createFood(spec.label)
    const target = compartmentCenters[spec.targetIndex]
    food.position.set(target.x, spec.floatY, target.z)
    food.rotation.set(index * 0.12, index * 0.32, index * 0.13)
    food.userData.home = food.position.clone()
    food.userData.baseRotation = (index - 2) * 0.05
    food.userData.target = new Vector3(target.x, 0.14, target.z)
    trayGroup?.add(food)

    return food
  })

  const particleGeometry = new BufferGeometry()
  const particlePositions = new Float32Array(180 * 3)

  for (let index = 0; index < particlePositions.length; index += 3) {
    particlePositions[index] = (Math.random() - 0.5) * 12
    particlePositions[index + 1] = (Math.random() - 0.5) * 7
    particlePositions[index + 2] = (Math.random() - 0.5) * 8
  }

  particleGeometry.setAttribute('position', new BufferAttribute(particlePositions, 3))

  const particles = new Points(
    particleGeometry,
    new PointsMaterial({
      color: 0x76f3b2,
      transparent: true,
      opacity: 0.36,
      size: 0.025,
    }),
  )
  scene.add(particles)

  resizeScene()
  animate()
}

function animate(time = 0) {
  if (!renderer || !scene || !camera || !trayGroup) {
    return
  }

  const elapsed = time * 0.001
  trayGroup.rotation.x = -0.08 + Math.sin(elapsed * 0.28) * 0.018
  trayGroup.rotation.y = 0.12 + Math.sin(elapsed * 0.34) * 0.07
  trayGroup.position.x = Math.sin(elapsed * 0.3) * 0.012
  trayGroup.position.y = 0.88 + Math.sin(elapsed * 0.48) * 0.07

  foods.forEach((food, index) => {
    if (isStarting.value) {
      food.position.lerp(food.userData.target, 0.08)
      food.material.rotation += (0 - food.material.rotation) * 0.08
      return
    }

    const home = food.userData.home as Vector3
    const baseRotation = food.userData.baseRotation as number
    food.position.x = home.x
    food.position.z = home.z
    food.position.y = home.y + Math.sin(elapsed * 1.05 + index * 0.72) * 0.1
    food.material.rotation = baseRotation + Math.sin(elapsed * 0.7 + index) * 0.025
  })

  renderer.render(scene, camera)
  frameId = window.requestAnimationFrame(animate)
}

function resizeScene() {
  if (!renderer || !camera) {
    return
  }

  const isNarrow = window.innerWidth < 680

  camera.aspect = window.innerWidth / window.innerHeight
  camera.position.y = isNarrow ? 6.55 : 5.15
  camera.position.z = isNarrow ? 10.6 : 6.85
  camera.lookAt(0, -0.08, 0)
  trayGroup?.scale.setScalar(isNarrow ? 0.64 : 0.88)
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function startBoot() {
  if (isStarting.value) {
    return
  }

  isStarting.value = true
  startedAt = window.setTimeout(() => emit('start'), 920)
}

onMounted(() => {
  buildScene()
  window.addEventListener('resize', resizeScene)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeScene)
  window.cancelAnimationFrame(frameId)
  window.clearTimeout(startedAt)
  renderer?.dispose()
  scene?.traverse((object) => {
    if (object instanceof Sprite) {
      object.material.map?.dispose()
      object.material.dispose()
      return
    }

    if (object instanceof Mesh || object instanceof Points) {
      object.geometry.dispose()

      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose())
      } else {
        object.material.dispose()
      }
    }
  })
})
</script>

<template>
  <section class="boot-screen" aria-label="啟動排版機">
    <canvas ref="canvasRef" class="boot-canvas"></canvas>
    <div class="boot-copy">
      <p class="boot-kicker">Flex 便當</p>
      <h1>把便當排好</h1>
      <p>心愛的妻子想把食材準確放進便當，可是排版機把位置弄亂了。請用 Flexbox 幫她把 .item 放回 .bento。</p>
      <div class="boot-actions">
        <button class="primary-boot-action" type="button" @click="startBoot">
          <Play :size="18" stroke-width="2.5" />
          開始第 1 關
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.boot-screen {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #f6fff8;
  background:
    linear-gradient(rgba(118, 243, 178, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(118, 243, 178, 0.06) 1px, transparent 1px),
    radial-gradient(circle at 50% 48%, rgba(255, 206, 84, 0.18), transparent 34%),
    #071013;
  background-size: 36px 36px, 36px 36px, auto, auto;
}

.boot-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.boot-copy {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 16px;
  width: min(720px, calc(100vw - 40px));
  margin-top: min(42vh, 360px);
  text-align: center;
  text-shadow: 0 3px 18px rgba(0, 0, 0, 0.92), 0 1px 4px rgba(0, 0, 0, 0.86);
}

.boot-copy::before {
  position: absolute;
  inset: -22px -28px -18px;
  z-index: -1;
  content: "";
  background: radial-gradient(ellipse at center, rgba(5, 16, 18, 0.78), rgba(5, 16, 18, 0.36) 54%, transparent 72%);
  pointer-events: none;
}

.boot-kicker {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.boot-kicker {
  margin: 0;
  color: #76f3b2;
  font-size: 13px;
}

.boot-copy h1 {
  margin: 0;
  color: #fff3bb;
  font-size: clamp(44px, 7vw, 82px);
  line-height: 0.96;
}

.boot-copy p {
  max-width: 560px;
  margin: 0;
  color: #f1fff8;
  font-size: 18px;
  font-weight: 650;
}

.boot-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.primary-boot-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 7px;
  font-weight: 800;
}

.primary-boot-action {
  border: 1px solid rgba(118, 243, 178, 0.72);
  color: #081114;
  background: #76f3b2;
  box-shadow: 0 0 28px rgba(118, 243, 178, 0.26);
}

.primary-boot-action:hover {
  background: #a2ffd0;
}

@media (max-width: 680px) {
  .boot-copy {
    gap: 12px;
    margin-top: min(40vh, 300px);
  }

  .boot-copy p {
    font-size: 15px;
  }

  .primary-boot-action {
    width: min(100%, 220px);
  }

}
</style>
