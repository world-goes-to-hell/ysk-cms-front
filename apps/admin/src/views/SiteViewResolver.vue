<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 현재 사이트 ID와 뷰 경로
// viewPath 형식: "board/BoardManagementView" (폴더/파일명)
const siteId = computed(() => route.params.siteId as string)
const viewPath = computed(() => route.meta.viewPath as string)

// 동적으로 로드된 컴포넌트
const dynamicComponent = ref<Component | null>(null)
const isLoading = ref(true)
const loadError = ref(false)

// 사이트별 뷰 로딩 함수
const loadSiteView = async () => {
  if (!siteId.value || !viewPath.value) return

  isLoading.value = true
  loadError.value = false

  try {
    // 1. 먼저 사이트 전용 뷰 시도 (views/sites/{siteId}/{viewPath}.vue)
    const siteModule = await import(`./sites/${siteId.value}/${viewPath.value}.vue`)
    dynamicComponent.value = siteModule.default
  } catch {
    try {
      // 2. 사이트 전용 뷰가 없으면 default 뷰 사용 (views/default/{viewPath}.vue)
      const defaultModule = await import(`./default/${viewPath.value}.vue`)
      dynamicComponent.value = defaultModule.default
    } catch {
      try {
        // 3. default에도 없으면 common 뷰 사용 (views/default/common/{viewPath}.vue)
        const commonModule = await import(`./default/common/${viewPath.value}.vue`)
        dynamicComponent.value = commonModule.default
      } catch {
        // 4. 모두 실패하면 에러
        loadError.value = true
        dynamicComponent.value = null
      }
    }
  } finally {
    isLoading.value = false
  }
}

// siteId나 viewPath가 변경될 때 뷰 다시 로드
watch([siteId, viewPath], loadSiteView, { immediate: true })
</script>

<template>
  <div class="site-view-resolver">
    <!-- 로딩 중 -->
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 에러 발생 -->
    <div v-else-if="loadError" class="error-state">
      <el-empty description="페이지를 불러올 수 없습니다">
        <el-button type="primary" @click="loadSiteView">다시 시도</el-button>
      </el-empty>
    </div>

    <!-- 동적 컴포넌트 렌더링 -->
    <component v-else-if="dynamicComponent" :is="dynamicComponent" />
  </div>
</template>

<style scoped>
.site-view-resolver {
  width: 100%;
  min-height: 200px;
}

.loading-state,
.error-state {
  padding: 40px;
}
</style>
