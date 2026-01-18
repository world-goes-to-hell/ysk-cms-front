<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getSiteByCode,
  createSite,
  updateSite,
  type Site,
  type SiteCreateRequest,
  type SiteUpdateRequest,
  type SiteStatus,
} from '@/api/site'

const router = useRouter()
const route = useRoute()

// 모드 (create | edit)
const mode = computed(() => (route.query.code ? 'edit' : 'create'))
const siteCode = computed(() => route.query.code as string)

// 상태
const loading = ref(false)
const formLoading = ref(false)
const originalSite = ref<Site | null>(null)

// 폼 데이터
const formData = ref<SiteCreateRequest>({
  code: '',
  name: '',
  description: '',
  domain: '',
  status: 'ACTIVE',
})

// 유효성 검사 에러
const errors = ref<Record<string, string>>({})

// 상태 옵션
const statusOptions: { value: SiteStatus; label: string; icon: string; description: string }[] = [
  { value: 'ACTIVE', label: '활성', icon: 'mdi-check-circle', description: '사이트가 정상 운영됩니다' },
  { value: 'INACTIVE', label: '비활성', icon: 'mdi-pause-circle', description: '사이트 접근이 차단됩니다' },
  { value: 'MAINTENANCE', label: '점검중', icon: 'mdi-wrench', description: '점검 안내 페이지가 표시됩니다' },
]

// 사이트 상세 조회
const fetchSite = async () => {
  if (!siteCode.value) return

  loading.value = true
  try {
    const response = await getSiteByCode(siteCode.value)
    if (response.data.success) {
      originalSite.value = response.data.data
      formData.value = {
        code: response.data.data.code,
        name: response.data.data.name,
        description: response.data.data.description || '',
        domain: response.data.data.domain || '',
        status: response.data.data.status,
      }
    }
  } catch (error: any) {
    console.error('사이트 조회 실패:', error)
    ElMessage.error('사이트 정보를 불러오는데 실패했습니다.')
    router.push('/sites')
  } finally {
    loading.value = false
  }
}

// 유효성 검사
const validate = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = '사이트 이름을 입력해주세요.'
  }

  if (mode.value === 'create') {
    if (!formData.value.code.trim()) {
      errors.value.code = '사이트 코드를 입력해주세요.'
    } else if (!/^[a-z0-9-]+$/.test(formData.value.code)) {
      errors.value.code = '영문 소문자, 숫자, 하이픈만 사용 가능합니다.'
    } else if (formData.value.code.length < 2 || formData.value.code.length > 50) {
      errors.value.code = '2~50자 사이로 입력해주세요.'
    }
  }

  if (formData.value.domain && !/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/.test(formData.value.domain)) {
    errors.value.domain = '올바른 도메인 형식을 입력해주세요.'
  }

  return Object.keys(errors.value).length === 0
}

// 폼 제출
const handleSubmit = async () => {
  if (!validate()) return

  formLoading.value = true
  try {
    if (mode.value === 'create') {
      const createData: SiteCreateRequest = {
        code: formData.value.code.toLowerCase().replace(/\s+/g, '-'),
        name: formData.value.name,
        description: formData.value.description,
        domain: formData.value.domain,
        status: formData.value.status,
      }
      const response = await createSite(createData)
      if (response.data.success) {
        ElMessage.success('사이트가 생성되었습니다.')
        router.push('/sites')
      }
    } else {
      const updateData: SiteUpdateRequest = {
        name: formData.value.name,
        description: formData.value.description,
        domain: formData.value.domain,
        status: formData.value.status,
      }
      const response = await updateSite(siteCode.value, updateData)
      if (response.data.success) {
        ElMessage.success('사이트 정보가 수정되었습니다.')
        router.push('/sites')
      }
    }
  } catch (error: any) {
    console.error('사이트 저장 실패:', error)
    const message = error.response?.data?.message || '사이트 저장에 실패했습니다.'
    ElMessage.error(message)
  } finally {
    formLoading.value = false
  }
}

// 취소
const handleCancel = () => {
  router.push('/sites')
}

// 코드 자동 변환 (소문자, 공백->하이픈)
const handleCodeInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  formData.value.code = input.value.toLowerCase().replace(/\s+/g, '-')
}

// 상태 아이콘 클래스
const getStatusIconClass = (status: SiteStatus) => {
  const classes: Record<SiteStatus, string> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
  }
  return classes[status]
}

// 라우트 변경 감지
watch(
  () => route.query.code,
  () => {
    if (route.query.code) {
      fetchSite()
    }
  }
)

onMounted(() => {
  if (mode.value === 'edit' && siteCode.value) {
    fetchSite()
  }
})
</script>

<template>
  <div class="site-form-page" v-loading="loading">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="handleCancel">
          <i class="mdi mdi-arrow-left"></i>
        </button>
        <div class="header-info">
          <h1>
            <i class="mdi" :class="mode === 'create' ? 'mdi-web-plus' : 'mdi-web-sync'"></i>
            {{ mode === 'create' ? '사이트 추가' : '사이트 수정' }}
          </h1>
          <p v-if="mode === 'create'">새로운 사이트를 생성합니다</p>
          <p v-else>{{ originalSite?.name }} 사이트 정보를 수정합니다</p>
        </div>
      </div>
    </div>

    <!-- 폼 컨테이너 -->
    <div class="form-container" v-loading="formLoading">
      <form @submit.prevent="handleSubmit">
        <!-- 기본 정보 섹션 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <i class="mdi mdi-information-outline"></i>
            </div>
            <div class="section-info">
              <h2>기본 정보</h2>
              <p>사이트의 기본적인 정보를 입력합니다</p>
            </div>
          </div>

          <div class="section-body">
            <!-- 사이트 코드 -->
            <div class="form-group" :class="{ 'has-error': errors.code }">
              <label class="form-label required">
                <i class="mdi mdi-code-tags"></i>
                사이트 코드
              </label>
              <div class="input-wrapper">
                <input
                  v-if="mode === 'create'"
                  v-model="formData.code"
                  @input="handleCodeInput"
                  type="text"
                  class="form-input"
                  placeholder="예: blog, shop, community"
                />
                <div v-else class="form-input-static">
                  <span class="code-badge">{{ formData.code }}</span>
                  <span class="readonly-hint">코드는 수정할 수 없습니다</span>
                </div>
              </div>
              <span v-if="errors.code" class="error-message">
                <i class="mdi mdi-alert-circle"></i>
                {{ errors.code }}
              </span>
              <span v-else-if="mode === 'create'" class="form-hint">
                영문 소문자, 숫자, 하이픈(-) 사용 가능. 2~50자
              </span>
            </div>

            <!-- 사이트 이름 -->
            <div class="form-group" :class="{ 'has-error': errors.name }">
              <label class="form-label required">
                <i class="mdi mdi-format-title"></i>
                사이트 이름
              </label>
              <div class="input-wrapper">
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  placeholder="사이트 이름을 입력하세요"
                />
              </div>
              <span v-if="errors.name" class="error-message">
                <i class="mdi mdi-alert-circle"></i>
                {{ errors.name }}
              </span>
            </div>

            <!-- 도메인 -->
            <div class="form-group" :class="{ 'has-error': errors.domain }">
              <label class="form-label">
                <i class="mdi mdi-link-variant"></i>
                도메인
              </label>
              <div class="input-wrapper has-prefix">
                <span class="input-prefix">https://</span>
                <input
                  v-model="formData.domain"
                  type="text"
                  class="form-input with-prefix"
                  placeholder="blog.example.com"
                />
              </div>
              <span v-if="errors.domain" class="error-message">
                <i class="mdi mdi-alert-circle"></i>
                {{ errors.domain }}
              </span>
              <span v-else class="form-hint">
                선택사항. 사이트에 연결할 도메인 주소
              </span>
            </div>

            <!-- 설명 -->
            <div class="form-group full-width">
              <label class="form-label">
                <i class="mdi mdi-text-box-outline"></i>
                설명
              </label>
              <div class="input-wrapper">
                <textarea
                  v-model="formData.description"
                  class="form-textarea"
                  placeholder="사이트에 대한 설명을 입력하세요"
                  rows="4"
                ></textarea>
              </div>
              <span class="form-hint character-count">
                {{ formData.description?.length || 0 }} / 500자
              </span>
            </div>
          </div>
        </div>

        <!-- 상태 설정 섹션 -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon status">
              <i class="mdi mdi-toggle-switch-outline"></i>
            </div>
            <div class="section-info">
              <h2>상태 설정</h2>
              <p>사이트의 운영 상태를 선택합니다</p>
            </div>
          </div>

          <div class="section-body">
            <div class="status-cards">
              <label
                v-for="opt in statusOptions"
                :key="opt.value"
                class="status-card"
                :class="[
                  getStatusIconClass(opt.value),
                  { selected: formData.status === opt.value }
                ]"
              >
                <input
                  type="radio"
                  v-model="formData.status"
                  :value="opt.value"
                  class="sr-only"
                />
                <div class="status-card-icon">
                  <i class="mdi" :class="opt.icon"></i>
                </div>
                <div class="status-card-content">
                  <span class="status-label">{{ opt.label }}</span>
                  <span class="status-description">{{ opt.description }}</span>
                </div>
                <div class="status-check">
                  <i class="mdi mdi-check-circle"></i>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="handleCancel">
            <i class="mdi mdi-close"></i>
            취소
          </button>
          <button type="submit" class="btn-submit" :disabled="formLoading">
            <i class="mdi" :class="mode === 'create' ? 'mdi-plus' : 'mdi-check'"></i>
            {{ mode === 'create' ? '사이트 생성' : '변경사항 저장' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.site-form-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: var(--bg-tertiary);
  border-color: #6366f1;
}

.btn-back .mdi {
  font-size: 22px;
  color: var(--text-primary);
}

.header-info h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.header-info h1 .mdi {
  font-size: 28px;
  color: #6366f1;
}

.header-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 폼 컨테이너 */
.form-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  overflow: hidden;
}

/* 섹션 */
.form-section {
  padding: 28px;
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.section-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.1));
  border-radius: 14px;
}

.section-icon .mdi {
  font-size: 24px;
  color: #6366f1;
}

.section-icon.status {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1));
}

.section-icon.status .mdi {
  color: #10b981;
}

.section-info h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.section-info p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.section-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

/* 폼 그룹 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group.has-error .form-input,
.form-group.has-error .form-textarea {
  border-color: #ef4444;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-label .mdi {
  font-size: 18px;
  color: var(--text-tertiary);
}

.form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 2px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper.has-prefix {
  display: flex;
  align-items: center;
}

.input-prefix {
  padding: 12px 0 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: 12px 0 0 12px;
  font-size: 14px;
  color: var(--text-tertiary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input.with-prefix {
  border-radius: 0 12px 12px 0;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
}

.form-input-static {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.code-badge {
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Fira Code', monospace;
}

.readonly-hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.form-hint.character-count {
  text-align: right;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ef4444;
}

.error-message .mdi {
  font-size: 14px;
}

/* 상태 카드 */
.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.status-card:hover {
  border-color: var(--text-tertiary);
}

.status-card.selected {
  border-color: #6366f1;
}

.status-card.selected.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.03);
}

.status-card.selected.inactive {
  border-color: #6b7280;
  background: rgba(107, 114, 128, 0.03);
}

.status-card.selected.maintenance {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.03);
}

.status-card-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--bg-tertiary);
}

.status-card-icon .mdi {
  font-size: 28px;
  color: var(--text-tertiary);
}

.status-card.active .status-card-icon {
  background: rgba(16, 185, 129, 0.1);
}

.status-card.active .status-card-icon .mdi {
  color: #10b981;
}

.status-card.inactive .status-card-icon {
  background: rgba(107, 114, 128, 0.1);
}

.status-card.inactive .status-card-icon .mdi {
  color: #6b7280;
}

.status-card.maintenance .status-card-icon {
  background: rgba(245, 158, 11, 0.1);
}

.status-card.maintenance .status-card-icon .mdi {
  color: #f59e0b;
}

.status-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.status-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-description {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.4;
}

.status-check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.status-check .mdi {
  font-size: 20px;
}

.status-card.selected .status-check {
  opacity: 1;
}

.status-card.selected.active .status-check .mdi {
  color: #10b981;
}

.status-card.selected.inactive .status-check .mdi {
  color: #6b7280;
}

.status-card.selected.maintenance .status-check .mdi {
  color: #f59e0b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 액션 버튼 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 28px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 다크모드 */
:root.dark .code-badge {
  background: rgba(99, 102, 241, 0.2);
}

:root.dark .status-card.selected.active {
  background: rgba(16, 185, 129, 0.08);
}

:root.dark .status-card.selected.inactive {
  background: rgba(107, 114, 128, 0.08);
}

:root.dark .status-card.selected.maintenance {
  background: rgba(245, 158, 11, 0.08);
}

/* 반응형 */
@media (max-width: 768px) {
  .site-form-page {
    padding: 0 16px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .header-info h1 {
    font-size: 22px;
  }

  .form-section {
    padding: 20px;
  }

  .section-body {
    grid-template-columns: 1fr;
  }

  .status-cards {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    padding: 20px;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
    justify-content: center;
  }
}
</style>
