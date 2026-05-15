<script setup lang="ts">
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Trophy,
  X,
} from 'lucide-vue-next'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdBanner from './components/AdBanner.vue'
import {
  levels,
  syntaxHints,
  type ExpectedDeclaration,
  type FlexProperty,
  type SyntaxKey,
} from './data/levels'

type FeedbackTone = 'idle' | 'success' | 'error'
type DeclarationMap = Partial<Record<FlexProperty, string>>
type GuideStep = {
  selector: string
  label: string
  title: string
  body: string
}

const BootScreen = defineAsyncComponent(() => import('./components/BootScreen.vue'))

const allowedProperties: FlexProperty[] = [
  'display',
  'justify-content',
  'align-items',
  'flex-direction',
  'flex-wrap',
]

const activeLevelIndex = ref(0)
const showBootScreen = ref(true)
const activeSyntax = ref<SyntaxKey>('display')
const cssDraft = ref(levels[0].starterCss)
const savedDrafts = ref<Record<number, string>>({ [levels[0].id]: levels[0].starterCss })
const completedLevels = ref<Set<number>>(new Set())
const feedbackMessage = ref('自動監聽中。寫進 .bento { display: flex; } 後，右側會立刻上線。')
const feedbackTone = ref<FeedbackTone>('idle')
const isCurrentAnswerValid = ref(false)
const isSyntaxHintFlashing = ref(false)
const syntaxFeedbackMessage = ref('')
const showGuide = ref(false)
const showFinale = ref(false)
const activeGuideStepIndex = ref(0)
const guideSpotlightStyle = ref<Record<string, string>>({})
const guideCardStyle = ref<Record<string, string>>({})
let syntaxFeedbackTimer = 0
let bootShortcutTimer = 0
let bootShortcutBuffer: string[] = []

const bootShortcutSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown']

const guideSteps: GuideStep[] = [
  {
    selector: '[data-guide-target="mission"]',
    label: '任務',
    title: '先看這一關要練什麼',
    body: '這裡會告訴你本關目標。第一關只要讓外容器 .bento 啟動 Flex，食材就會開始被控制。',
  },
  {
    selector: '[data-guide-target="syntax"]',
    label: '語法',
    title: '語法提示會在這裡',
    body: '提示卡會顯示白話說明和本關可能會用到的值。如果某關有多個語法，才會出現上方切換按鈕。',
  },
  {
    selector: '[data-guide-target="editor"]',
    label: '輸入',
    title: '在這裡寫 CSS',
    body: '把答案寫進 CSS 輸入區。第一關請把 display: flex; 放在 .bento 的大括號裡。',
  },
  {
    selector: '[data-guide-target="feedback"]',
    label: '檢查',
    title: '系統會自動檢查',
    body: '不用按檢查。只要語法寫對，這裡會變成成功訊息，按鈕也會直接變成下一關。',
  },
  {
    selector: '[data-guide-target="stage"]',
    label: '預覽',
    title: '右邊會即時變化',
    body: '左側是目標槽位，右側是你的便當。你寫的 Flexbox 會立刻套用在 .bento 上。',
  },
  {
    selector: '[data-guide-target="levels"]',
    label: '關卡',
    title: '這裡可以切換關卡',
    body: '黃色代表目前關卡，綠色代表已完成。卡關時可以先去別關看看，再回來挑戰。',
  },
]

const currentLevel = computed(() => levels[activeLevelIndex.value])
const currentHint = computed(() => syntaxHints[activeSyntax.value])
const shouldShowSyntaxTabs = computed(() => currentLevel.value.syntax.length > 1)
const completedLevelCount = computed(() => completedLevels.value.size)
const isAllLevelsComplete = computed(() => completedLevelCount.value === levels.length)
const isCurrentLevelComplete = computed(() => completedLevels.value.has(currentLevel.value.id))
const hasNextLevel = computed(() => activeLevelIndex.value < levels.length - 1)
const bentoDeclarations = computed(() => getDeclarationMap(cssDraft.value, '.bento'))
const itemDeclarations = computed(() => getDeclarationMap(cssDraft.value, '.item'))
const isBentoFlexing = computed(() => bentoDeclarations.value.display === 'flex')
const machineStatus = computed(() => {
  if (isAllLevelsComplete.value) {
    return '排版結果：全任務完成'
  }

  if (isCurrentAnswerValid.value) {
    return '排版結果：完成'
  }

  return isBentoFlexing.value ? '排版引擎：運作中' : '排版引擎：待機'
})
const actionButtonLabel = computed(() => {
  if (hasNextLevel.value) {
    return '下一關'
  }

  return isAllLevelsComplete.value ? '完成任務' : '補完關卡'
})
const currentLevelClass = computed(() => `level-${currentLevel.value.id}`)
const currentGuideStep = computed(() => guideSteps[activeGuideStepIndex.value])
const isLastGuideStep = computed(() => activeGuideStepIndex.value === guideSteps.length - 1)
const targetBentoStyle = computed(() => declarationsToStyle(expectedToMap(currentLevel.value.expected, '.bento')))
const targetItemStyle = computed(() => declarationsToStyle(expectedToMap(currentLevel.value.expected, '.item')))
const previewBentoStyle = computed(() => declarationsToStyle(bentoDeclarations.value))
const previewItemStyle = computed(() => declarationsToStyle(itemDeclarations.value))
const bootLog = computed(() => {
  if (isCurrentAnswerValid.value) {
    return `系統紀錄：${currentLevel.value.successMessage}`
  }

  if (isBentoFlexing.value) {
    return '系統紀錄：正在套用 .bento 的 Flex 設定'
  }

  return '系統紀錄：等待 .bento 啟動 display: flex'
})

function selectLevel(index: number) {
  activeLevelIndex.value = index
}

function selectSyntax(syntax: SyntaxKey) {
  activeSyntax.value = syntax
  syntaxFeedbackMessage.value = `已顯示 ${syntaxHints[syntax].label} 提示`
  isSyntaxHintFlashing.value = false
  window.clearTimeout(syntaxFeedbackTimer)

  window.requestAnimationFrame(() => {
    isSyntaxHintFlashing.value = true
  })

  syntaxFeedbackTimer = window.setTimeout(() => {
    isSyntaxHintFlashing.value = false
    syntaxFeedbackMessage.value = ''
  }, 1300)
}

function enterGame() {
  showBootScreen.value = false

  if (activeLevelIndex.value === 0 && !completedLevels.value.has(levels[0].id)) {
    openGuide()
  }
}

function completeAllLevelsAndShowFinale() {
  completedLevels.value = new Set(levels.map((level) => level.id))
  activeLevelIndex.value = levels.length - 1
  showBootScreen.value = false
  showGuide.value = false
  showFinale.value = true
}

function handleBootShortcut(event: KeyboardEvent) {
  if (!showBootScreen.value || showFinale.value || !bootShortcutSequence.includes(event.key)) {
    return
  }

  window.clearTimeout(bootShortcutTimer)
  bootShortcutBuffer.push(event.key)
  bootShortcutBuffer = bootShortcutBuffer.slice(-bootShortcutSequence.length)

  if (bootShortcutBuffer.join('|') === bootShortcutSequence.join('|')) {
    bootShortcutBuffer = []
    completeAllLevelsAndShowFinale()
    return
  }

  bootShortcutTimer = window.setTimeout(() => {
    bootShortcutBuffer = []
  }, 1500)
}

function goToNextLevel() {
  if (!isCurrentAnswerValid.value) {
    return
  }

  if (!hasNextLevel.value) {
    if (!isAllLevelsComplete.value) {
      const firstIncompleteIndex = levels.findIndex((level) => !completedLevels.value.has(level.id))

      if (firstIncompleteIndex !== -1) {
        selectLevel(firstIncompleteIndex)
      }

      return
    }

    showFinale.value = true
    return
  }

  selectLevel(activeLevelIndex.value + 1)
}

function returnToHome() {
  showFinale.value = false
  showGuide.value = false
  showBootScreen.value = true
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function updateGuideLayout() {
  if (!showGuide.value) {
    return
  }

  window.requestAnimationFrame(() => {
    const target = document.querySelector(currentGuideStep.value.selector)

    if (!(target instanceof HTMLElement)) {
      guideSpotlightStyle.value = {}
      guideCardStyle.value = {
        left: '50%',
        top: '50%',
        width: 'min(360px, calc(100vw - 32px))',
        transform: 'translate(-50%, -50%)',
      }
      return
    }

    const rect = target.getBoundingClientRect()
    const padding = 10
    const spotlight = {
      left: clamp(rect.left - padding, 12, window.innerWidth - 24),
      top: clamp(rect.top - padding, 12, window.innerHeight - 24),
      width: Math.min(rect.width + padding * 2, window.innerWidth - 24),
      height: Math.min(rect.height + padding * 2, window.innerHeight - 24),
    }

    guideSpotlightStyle.value = {
      left: `${spotlight.left}px`,
      top: `${spotlight.top}px`,
      width: `${spotlight.width}px`,
      height: `${spotlight.height}px`,
    }

    const cardWidth = Math.min(360, window.innerWidth - 32)
    const cardHeight = 286
    let cardLeft = spotlight.left + spotlight.width + 22
    let cardTop = spotlight.top

    if (cardLeft + cardWidth > window.innerWidth - 16) {
      cardLeft = spotlight.left - cardWidth - 22
    }

    if (cardLeft < 16) {
      cardLeft = clamp((window.innerWidth - cardWidth) / 2, 16, window.innerWidth - cardWidth - 16)
      cardTop = spotlight.top + spotlight.height + 18
    }

    if (cardTop + cardHeight > window.innerHeight - 16) {
      cardTop = spotlight.top - cardHeight - 18
    }

    if (cardTop < 16) {
      cardTop = 16
    }

    guideCardStyle.value = {
      left: `${cardLeft}px`,
      top: `${cardTop}px`,
      width: `${cardWidth}px`,
      transform: 'none',
    }
  })
}

function openGuide() {
  activeGuideStepIndex.value = 0
  showGuide.value = true
  nextTick(updateGuideLayout)
}

function closeGuide() {
  showGuide.value = false
}

function goToPreviousGuideStep() {
  if (activeGuideStepIndex.value === 0) {
    return
  }

  activeGuideStepIndex.value -= 1
}

function goToNextGuideStep() {
  if (isLastGuideStep.value) {
    closeGuide()
    return
  }

  activeGuideStepIndex.value += 1
}

function stripCssComments(code: string) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '')
}

function getRuleBody(code: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const ruleMatch = stripCssComments(code).match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'i'))

  return ruleMatch?.[1] ?? ''
}

function getDeclarationMap(code: string, selector: string): DeclarationMap {
  return getRuleBody(code, selector)
    .split(';')
    .map((declaration) => declaration.trim().toLowerCase())
    .reduce<DeclarationMap>((declarations, declaration) => {
      const separatorIndex = declaration.indexOf(':')

      if (separatorIndex === -1) {
        return declarations
      }

      const property = declaration.slice(0, separatorIndex).trim() as FlexProperty
      const value = declaration.slice(separatorIndex + 1).trim()

      if (allowedProperties.includes(property) && value) {
        declarations[property] = value
      }

      return declarations
    }, {})
}

function expectedToMap(expected: ExpectedDeclaration[], selector: string): DeclarationMap {
  return expected.reduce<DeclarationMap>((declarations, declaration) => {
    if ((declaration.selector ?? '.bento') === selector) {
      declarations[declaration.property] = declaration.value
    }

    return declarations
  }, {})
}

function declarationsToStyle(declarations: DeclarationMap): Record<string, string> {
  const style: Record<string, string> = {}

  if (declarations.display) {
    style.display = declarations.display
  }
  if (declarations['justify-content']) {
    style.justifyContent = declarations['justify-content']
  }
  if (declarations['align-items']) {
    style.alignItems = declarations['align-items']
  }
  if (declarations['flex-direction']) {
    style.flexDirection = declarations['flex-direction']
  }
  if (declarations['flex-wrap']) {
    style.flexWrap = declarations['flex-wrap']
  }

  return style
}

function formatDeclaration(declaration: ExpectedDeclaration) {
  return `${declaration.selector ?? '.bento'} { ${declaration.property}: ${declaration.value} }`
}

function completeLevel(levelId: number) {
  completedLevels.value = new Set([...completedLevels.value, levelId])
}

function evaluateCurrentAnswer() {
  const forbiddenDeclaration = currentLevel.value.forbidden?.find((declaration) => {
    const selectorDeclarations = getDeclarationMap(cssDraft.value, declaration.selector)

    return selectorDeclarations[declaration.property] === declaration.value
  })

  if (forbiddenDeclaration) {
    isCurrentAnswerValid.value = false
    feedbackTone.value = 'error'
    feedbackMessage.value = forbiddenDeclaration.message
    return
  }

  const missingDeclaration = currentLevel.value.expected.find((declaration) => {
    const selectorDeclarations = getDeclarationMap(cssDraft.value, declaration.selector ?? '.bento')

    return selectorDeclarations[declaration.property] !== declaration.value
  })

  if (!missingDeclaration) {
    isCurrentAnswerValid.value = true
    completeLevel(currentLevel.value.id)
    feedbackTone.value = 'success'
    feedbackMessage.value = currentLevel.value.successMessage
    return
  }

  isCurrentAnswerValid.value = false

  if (missingDeclaration.property === 'display' && (missingDeclaration.selector ?? '.bento') === '.bento') {
    feedbackTone.value = 'idle'
    feedbackMessage.value = '先讓外容器 .bento 啟動 display: flex，食材才會開始被控制。'
    return
  }

  const missingSelector = missingDeclaration.selector ?? '.bento'
  const currentValue = getDeclarationMap(cssDraft.value, missingSelector)[missingDeclaration.property]
  feedbackTone.value = currentValue ? 'error' : 'idle'
  feedbackMessage.value = currentValue
    ? `現在是 ${missingSelector} { ${missingDeclaration.property}: ${currentValue} }，目標是 ${formatDeclaration(missingDeclaration)}。`
    : `還缺 ${formatDeclaration(missingDeclaration)}。`
}

watch(
  currentLevel,
  (level) => {
    cssDraft.value = savedDrafts.value[level.id] ?? level.starterCss
    activeSyntax.value = level.syntax[0]
    isSyntaxHintFlashing.value = false
    syntaxFeedbackMessage.value = ''
    evaluateCurrentAnswer()
  },
  { immediate: true },
)

watch(cssDraft, (draft) => {
  savedDrafts.value = {
    ...savedDrafts.value,
    [currentLevel.value.id]: draft,
  }
  evaluateCurrentAnswer()
})

watch([showGuide, activeGuideStepIndex], () => {
  nextTick(updateGuideLayout)
})

onMounted(() => {
  window.addEventListener('resize', updateGuideLayout)
  window.addEventListener('keydown', handleBootShortcut)
})

onBeforeUnmount(() => {
  window.clearTimeout(syntaxFeedbackTimer)
  window.clearTimeout(bootShortcutTimer)
  window.removeEventListener('resize', updateGuideLayout)
  window.removeEventListener('keydown', handleBootShortcut)
})
</script>

<template>
  <BootScreen v-if="showBootScreen" @start="enterGame" />
  <main class="game-shell" aria-label="Flex 便當遊戲畫面">
    <section class="control-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">便當排版機 // Flex 練習</p>
          <h1>Flex 便當</h1>
        </div>
        <div class="topbar-actions">
          <button class="guide-button" type="button" @click="openGuide">
            <BookOpen :size="16" stroke-width="2.3" />
            引導
          </button>
          <p class="level-count">第 {{ currentLevel.id }} / {{ levels.length }} 關</p>
        </div>
      </header>

      <article class="mission">
        <div class="mission-brief" data-guide-target="mission">
          <p class="mission-kicker">{{ currentLevel.focus }}</p>
          <h2>{{ currentLevel.title }}</h2>
          <p>{{ currentLevel.objective }}</p>
        </div>

        <div v-if="shouldShowSyntaxTabs" class="syntax-row" aria-label="語法提示" data-guide-target="syntax">
          <button
            v-for="syntax in currentLevel.syntax"
            :key="syntax"
            class="syntax-chip"
            :class="{ active: syntax === activeSyntax }"
            type="button"
            @click="selectSyntax(syntax)"
          >
            {{ syntaxHints[syntax].label }}
          </button>
        </div>

        <aside
          class="syntax-card"
          :class="{ 'is-flashing': isSyntaxHintFlashing }"
          :data-guide-target="shouldShowSyntaxTabs ? undefined : 'syntax'"
          aria-live="polite"
        >
          <div class="syntax-card-header">
            <p class="card-label">語法提示</p>
            <span v-if="syntaxFeedbackMessage" class="syntax-feedback">{{ syntaxFeedbackMessage }}</span>
            <h3>{{ currentHint.label }}</h3>
          </div>
          <p>{{ currentHint.description }}</p>
          <ul>
            <li v-for="value in currentHint.values" :key="value">
              <code>{{ value }}</code>
            </li>
          </ul>
        </aside>
      </article>

      <section class="editor-shell" aria-label="CSS 輸入區" data-guide-target="editor">
        <div class="editor-topline">
          <span>CSS 輸入</span>
          <span>作用範圍：{{ currentLevel.scope }}</span>
        </div>
        <textarea v-model="cssDraft" spellcheck="false" />
        <div class="action-row" data-guide-target="feedback">
          <button v-if="isCurrentAnswerValid" class="next-button" type="button" @click="goToNextLevel">
            <CheckCircle2 :size="16" stroke-width="2.4" />
            {{ actionButtonLabel }}
            <ArrowRight v-if="hasNextLevel" :size="16" stroke-width="2.4" />
            <PartyPopper v-else :size="16" stroke-width="2.4" />
          </button>
          <span v-else class="auto-indicator">自動檢查</span>
          <p class="level-state" :class="feedbackTone" aria-live="polite">
            {{ feedbackMessage }}
          </p>
        </div>
      </section>

      <nav class="level-strip" aria-label="關卡列表" data-guide-target="levels">
        <button
          v-for="(level, index) in levels"
          :key="level.id"
          class="level-dot"
          :class="{ active: index === activeLevelIndex, complete: completedLevels.has(level.id) }"
          type="button"
          @click="selectLevel(index)"
        >
          {{ level.id }}
        </button>
      </nav>
    </section>

    <section class="stage-panel">
      <div class="machine-header">
        <span>{{ machineStatus }}</span>
        <span>目標：{{ currentLevel.target }}</span>
      </div>

      <div
        class="bento-stage"
        :class="[currentLevelClass, { 'is-flexing': isBentoFlexing, 'is-complete': isCurrentAnswerValid }]"
        data-guide-target="stage"
      >
        <div class="stage-label target-label">目標槽位</div>
        <div class="stage-label player-label">你的便當</div>
        <div class="container-outline" aria-hidden="true">
          <span class="container-tag">外容器 .bento</span>
        </div>

        <div class="target-rack" :style="targetBentoStyle" aria-hidden="true">
          <span
            v-for="ingredient in currentLevel.ingredients"
            :key="`target-${ingredient.label}`"
            class="target-slot"
            :style="targetItemStyle"
          ></span>
        </div>

        <div class="ingredient-rack" :style="previewBentoStyle">
          <div
            v-for="ingredient in currentLevel.ingredients"
            :key="ingredient.label"
            class="ingredient item"
            :class="ingredient.tone"
            :style="previewItemStyle"
          >
            <span class="ingredient-tag">內元件 .item</span>
            <strong>{{ ingredient.label }}</strong>
          </div>
        </div>

        <div v-if="isCurrentAnswerValid" class="success-badge" aria-live="polite">
          <PartyPopper :size="22" stroke-width="2.2" />
          <div>
            <strong>過關成功</strong>
            <span>便當排版完成</span>
          </div>
        </div>
        <div class="boot-log" :class="{ success: isCurrentLevelComplete }">
          {{ bootLog }}
        </div>
      </div>

      <AdBanner />
    </section>
  </main>

  <Teleport to="body">
    <section v-if="showFinale" class="finale-screen" role="dialog" aria-modal="true" aria-label="全任務完成">
      <div class="finale-confetti" aria-hidden="true">
        <span v-for="index in 18" :key="index"></span>
      </div>

      <article class="finale-card">
        <div class="finale-icon">
          <Trophy :size="42" stroke-width="2.2" />
        </div>
        <p class="finale-kicker">Flex 便當完成報告</p>
        <h2>全任務完成</h2>
        <p>所有食材都被放進正確位置。你已經練過本週講義裡的 Flexbox 核心範圍，可以回去挑戰切版任務了。</p>

        <div class="finale-stats">
          <div>
            <strong>{{ completedLevelCount }} / {{ levels.length }}</strong>
            <span>完成關卡</span>
          </div>
          <div>
            <strong>5</strong>
            <span>本週語法</span>
          </div>
          <div>
            <strong>.bento</strong>
            <span>外容器啟動</span>
          </div>
        </div>

        <button class="guide-primary" type="button" @click="returnToHome">
          回首頁
        </button>
      </article>
    </section>

    <section v-if="showGuide" class="guide-tour" role="dialog" aria-modal="true" aria-label="第一關引導">
      <div class="guide-click-catcher"></div>
      <div class="guide-spotlight" :style="guideSpotlightStyle" aria-hidden="true"></div>
      <article class="guide-card" :style="guideCardStyle">
        <header class="guide-card-header">
          <div>
            <p class="guide-eyebrow">第一次進入 Flex 便當</p>
            <strong>{{ currentGuideStep.label }}</strong>
          </div>
          <button class="guide-close" type="button" aria-label="關閉引導" @click="closeGuide">
            <X :size="17" stroke-width="2.4" />
          </button>
        </header>

        <div class="guide-progress" aria-hidden="true">
          <span
            v-for="(step, index) in guideSteps"
            :key="step.label"
            :class="{ active: index === activeGuideStepIndex, done: index < activeGuideStepIndex }"
          ></span>
        </div>

        <p class="guide-step-count">第 {{ activeGuideStepIndex + 1 }} / {{ guideSteps.length }} 步</p>
        <h2>{{ currentGuideStep.title }}</h2>
        <p>{{ currentGuideStep.body }}</p>

        <div class="guide-actions">
          <button class="guide-secondary" type="button" :disabled="activeGuideStepIndex === 0" @click="goToPreviousGuideStep">
            <ChevronLeft :size="16" stroke-width="2.4" />
            上一步
          </button>
          <button class="guide-primary" type="button" @click="goToNextGuideStep">
            {{ isLastGuideStep ? '開始挑戰' : '下一步' }}
            <ChevronRight v-if="!isLastGuideStep" :size="16" stroke-width="2.4" />
            <CheckCircle2 v-else :size="16" stroke-width="2.4" />
          </button>
        </div>
      </article>
    </section>
  </Teleport>
</template>
