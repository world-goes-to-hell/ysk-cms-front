<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TheHeader from '@/components/layout/TheHeader.vue'
import TheFooter from '@/components/layout/TheFooter.vue'

const route = useRoute()

// 홈페이지에서는 투명 헤더 사용
const isTransparentHeader = computed(() => route.path === '/')
</script>

<template>
  <div class="layout">
    <TheHeader :transparent="isTransparentHeader" />
    <main class="main">
      <RouterView />
    </main>
    <TheFooter />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
}
</style>
