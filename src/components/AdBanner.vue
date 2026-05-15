<script setup lang="ts">
import { computed, onMounted } from 'vue'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

const adClient = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined
const adSlot = import.meta.env.VITE_ADSENSE_SLOT as string | undefined
const hasAdSenseConfig = computed(() => Boolean(adClient && adSlot))

function loadAdSenseScript() {
  if (!adClient || document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.dataset.flexBentoAdsense = 'true'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`
  document.head.appendChild(script)
}

onMounted(() => {
  if (!hasAdSenseConfig.value) {
    return
  }

  loadAdSenseScript()
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.push({})
})
</script>

<template>
  <aside class="ad-banner" aria-label="廣告">
    <template v-if="hasAdSenseConfig">
      <ins
        class="adsbygoogle"
        style="display: inline-block; width: 728px; height: 90px; max-width: 100%;"
        :data-ad-client="adClient"
        :data-ad-slot="adSlot"
      ></ins>
    </template>

    <template v-else>
      <p>廣告版位</p>
      <strong>728 × 90</strong>
      <span>AdSense 審核通過後放這裡</span>
    </template>
  </aside>
</template>
