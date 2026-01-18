<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalElements?: number
  pageSize?: number
  pageSizes?: number[]
  showTotal?: boolean
  showSizeChanger?: boolean
  showJumper?: boolean
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalElements: 0,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  showTotal: true,
  showSizeChanger: false,
  showJumper: false,
  maxVisiblePages: 5,
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  pageChange: [page: number]
  sizeChange: [size: number]
}>()

// 표시할 페이지 번호 계산
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = props.totalPages
  const current = props.currentPage
  const maxVisible = props.maxVisiblePages

  if (total <= maxVisible + 2) {
    // 전체 페이지가 적으면 모두 표시
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 항상 첫 페이지 표시
    pages.push(1)

    // 시작 페이지 계산
    let start = Math.max(2, current - Math.floor(maxVisible / 2))
    let end = Math.min(total - 1, start + maxVisible - 1)

    // 끝에 가까우면 시작점 조정
    if (end === total - 1) {
      start = Math.max(2, end - maxVisible + 1)
    }

    // 첫 페이지와 시작 사이에 간격이 있으면 ... 표시
    if (start > 2) {
      pages.push('...')
    }

    // 중간 페이지들
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // 끝 페이지와 마지막 사이에 간격이 있으면 ... 표시
    if (end < total - 1) {
      pages.push('...')
    }

    // 항상 마지막 페이지 표시
    if (total > 1) {
      pages.push(total)
    }
  }

  return pages
})

// 페이지 변경
const goToPage = (page: number | string) => {
  if (typeof page === 'string') return
  if (page < 1 || page > props.totalPages) return
  if (page === props.currentPage) return

  emit('update:currentPage', page)
  emit('pageChange', page)
}

// 이전 페이지
const prevPage = () => {
  if (props.currentPage > 1) {
    goToPage(props.currentPage - 1)
  }
}

// 다음 페이지
const nextPage = () => {
  if (props.currentPage < props.totalPages) {
    goToPage(props.currentPage + 1)
  }
}

// 첫 페이지
const firstPage = () => {
  goToPage(1)
}

// 마지막 페이지
const lastPage = () => {
  goToPage(props.totalPages)
}

// 페이지 사이즈 변경
const handleSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const size = parseInt(target.value)
  emit('update:pageSize', size)
  emit('sizeChange', size)
}

// 페이지 점프
const handleJump = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    const target = event.target as HTMLInputElement
    const page = parseInt(target.value)
    if (!isNaN(page) && page >= 1 && page <= props.totalPages) {
      goToPage(page)
      target.value = ''
    }
  }
}

// 현재 표시 범위 계산
const displayRange = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize + 1
  const end = Math.min(props.currentPage * props.pageSize, props.totalElements)
  return { start, end }
})
</script>

<template>
  <div class="pagination-container">
    <!-- 총 아이템 수 -->
    <div v-if="showTotal && totalElements > 0" class="pagination-total">
      <span class="total-text">
        총 <strong>{{ totalElements.toLocaleString() }}</strong>개 중
        {{ displayRange.start }}-{{ displayRange.end }}
      </span>
    </div>

    <!-- 페이지 사이즈 선택 -->
    <div v-if="showSizeChanger" class="pagination-size">
      <select :value="pageSize" class="size-select" @change="handleSizeChange">
        <option v-for="size in pageSizes" :key="size" :value="size">
          {{ size }}개씩
        </option>
      </select>
    </div>

    <!-- 페이지네이션 본체 -->
    <div class="pagination-nav">
      <!-- 첫 페이지 -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === 1"
        title="첫 페이지"
        @click="firstPage"
      >
        <i class="mdi mdi-chevron-double-left"></i>
      </button>

      <!-- 이전 페이지 -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === 1"
        title="이전 페이지"
        @click="prevPage"
      >
        <i class="mdi mdi-chevron-left"></i>
      </button>

      <!-- 페이지 번호들 -->
      <template v-for="(page, index) in visiblePages" :key="index">
        <span v-if="page === '...'" class="page-ellipsis">...</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- 다음 페이지 -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === totalPages"
        title="다음 페이지"
        @click="nextPage"
      >
        <i class="mdi mdi-chevron-right"></i>
      </button>

      <!-- 마지막 페이지 -->
      <button
        class="page-btn nav-btn"
        :disabled="currentPage === totalPages"
        title="마지막 페이지"
        @click="lastPage"
      >
        <i class="mdi mdi-chevron-double-right"></i>
      </button>
    </div>

    <!-- 페이지 점프 -->
    <div v-if="showJumper && totalPages > 1" class="pagination-jumper">
      <span class="jumper-label">이동</span>
      <input
        type="number"
        class="jumper-input"
        :min="1"
        :max="totalPages"
        :placeholder="String(currentPage)"
        @keydown="handleJump"
      />
      <span class="jumper-label">페이지</span>
    </div>
  </div>
</template>

<!-- CSS: public/css/components/pagination.css -->
