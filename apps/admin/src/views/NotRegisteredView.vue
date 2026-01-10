<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-registered">
    <div class="content-card">
      <div class="icon-wrapper">
        <i class="mdi mdi-file-question-outline"></i>
      </div>
      <h1>페이지가 등록되지 않았습니다</h1>
      <p class="description">
        요청하신 페이지에 연결된 컴포넌트가 없습니다.<br>
        관리자 메뉴에서 해당 메뉴의 <strong>Vue 컴포넌트</strong>를 설정해주세요.
      </p>
      <div class="info-box">
        <i class="mdi mdi-information-outline"></i>
        <div>
          <strong>해결 방법</strong>
          <ol>
            <li>관리자 메뉴 관리 페이지로 이동</li>
            <li>해당 메뉴 수정</li>
            <li>Vue 컴포넌트 선택 후 저장</li>
          </ol>
        </div>
      </div>
      <div class="actions">
        <button class="btn secondary" @click="goBack">
          <i class="mdi mdi-arrow-left"></i>
          이전 페이지
        </button>
        <button class="btn primary" @click="goHome">
          <i class="mdi mdi-home"></i>
          대시보드로 이동
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-registered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 40px;
}

.content-card {
  max-width: 520px;
  text-align: center;
  padding: 48px;
  background: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.icon-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
  border-radius: 50%;
}

.icon-wrapper .mdi {
  font-size: 48px;
  color: #f59e0b;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.description {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 24px;
}

.description strong {
  color: var(--accent-primary);
}

.info-box {
  display: flex;
  gap: 16px;
  text-align: left;
  padding: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  margin-bottom: 32px;
}

.info-box > .mdi {
  font-size: 24px;
  color: var(--accent-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-box strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.info-box ol {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn .mdi {
  font-size: 18px;
}

.btn.secondary {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn.secondary:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn.primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}
</style>
