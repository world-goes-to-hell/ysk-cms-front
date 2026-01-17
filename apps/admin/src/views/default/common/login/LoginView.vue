<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { register, getRoles } from '@/api/auth'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { RoleDto } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 로그인/회원가입 모드 토글
const isRegisterMode = ref(false)
const registerLoading = ref(false)
const registerSuccess = ref(false)

// 역할 목록
const roles = ref<RoleDto[]>([])
const rolesLoading = ref(false)

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: '',
  remember: false,
})

const registerFormRef = ref<FormInstance>()
const registerForm = reactive({
  username: '',
  password: '',
  passwordConfirm: '',
  name: '',
  email: '',
  roleId: null as number | null,
  phone: '',
  department: '',
  position: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '사용자명을 입력해주세요', trigger: 'blur' }],
  password: [{ required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' }],
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '아이디를 입력해주세요', trigger: 'blur' },
    { min: 4, max: 50, message: '아이디는 4자 이상 50자 이하여야 합니다', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '비밀번호를 입력해주세요', trigger: 'blur' },
    { min: 8, message: '비밀번호는 8자 이상이어야 합니다', trigger: 'blur' },
  ],
  passwordConfirm: [
    { required: true, message: '비밀번호 확인을 입력해주세요', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('비밀번호가 일치하지 않습니다'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '이름을 입력해주세요', trigger: 'blur' }],
  email: [
    { required: true, message: '이메일을 입력해주세요', trigger: 'blur' },
    { type: 'email', message: '올바른 이메일 형식이 아닙니다', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '역할을 선택해주세요', trigger: 'change' }],
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      const result = await authStore.login({
        username: form.username,
        password: form.password,
      })

      if (result.success) {
        router.push('/adm/dashboard')
      }
    }
  })
}

const fetchRoles = async () => {
  rolesLoading.value = true
  try {
    const response = await getRoles()
    if (response.data.success) {
      roles.value = response.data.data
    }
  } catch (error) {
    console.error('역할 목록 조회 실패:', error)
  } finally {
    rolesLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        const response = await register({
          username: registerForm.username,
          password: registerForm.password,
          name: registerForm.name,
          email: registerForm.email,
          roleId: registerForm.roleId!,
          phone: registerForm.phone || undefined,
          department: registerForm.department || undefined,
          position: registerForm.position || undefined,
        })

        if (response.data.success) {
          registerSuccess.value = true
          ElMessage.success(response.data.message || '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.')
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
        ElMessage.error(errorMessage)
      } finally {
        registerLoading.value = false
      }
    }
  })
}

const switchToLogin = () => {
  isRegisterMode.value = false
  registerSuccess.value = false
  // 회원가입 폼 초기화
  registerForm.username = ''
  registerForm.password = ''
  registerForm.passwordConfirm = ''
  registerForm.name = ''
  registerForm.email = ''
  registerForm.roleId = null
  registerForm.phone = ''
  registerForm.department = ''
  registerForm.position = ''
}

const switchToRegister = () => {
  isRegisterMode.value = true
  authStore.clearError()
  // 역할 목록 로드
  if (roles.value.length === 0) {
    fetchRoles()
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (isRegisterMode.value) {
      handleRegister()
    } else {
      handleLogin()
    }
  }
}
</script>

<template>
  <div class="login-wrapper">
    <!-- 좌측 브랜딩 영역 -->
    <div class="branding-section">
      <!-- 배경 그래픽 -->
      <div class="bg-pattern">
        <div class="grid-lines"></div>
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
      </div>

      <!-- 플로팅 도형 -->
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="brand-inner">
        <!-- 상단 로고 -->
        <div class="brand-header">
          <div class="logo-mark">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="18" height="18" rx="4" fill="currentColor" opacity="0.9" />
              <rect x="26" y="4" width="18" height="18" rx="4" fill="currentColor" opacity="0.6" />
              <rect x="4" y="26" width="18" height="18" rx="4" fill="currentColor" opacity="0.6" />
              <rect x="26" y="26" width="18" height="18" rx="4" fill="currentColor" opacity="0.3" />
            </svg>
          </div>
        </div>

        <!-- 중앙 메인 콘텐츠 -->
        <div class="brand-main">
          <h1 class="brand-title">YSK CMS</h1>
          <p class="brand-subtitle">Content Management System</p>
          <p class="brand-description">
            효율적인 콘텐츠 관리와 사용자 경험을 위한<br />통합 관리 시스템
          </p>

          <div class="feature-row">
            <div class="feature-item">
              <el-icon><DataAnalysis /></el-icon>
              <span>실시간 대시보드</span>
            </div>
            <div class="feature-item">
              <el-icon><UserFilled /></el-icon>
              <span>사용자 관리</span>
            </div>
            <div class="feature-item">
              <el-icon><Document /></el-icon>
              <span>콘텐츠 관리</span>
            </div>
          </div>
        </div>

        <!-- 하단 푸터 -->
        <div class="brand-footer">
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-number">99.9%</span>
              <span class="stat-label">가동률</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">모니터링</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">SSL</span>
              <span class="stat-label">보안</span>
            </div>
          </div>
          <p class="powered-by">Powered by Vue 3 + TypeScript + Spring Boot</p>
        </div>
      </div>
    </div>

    <!-- 우측 로그인/회원가입 폼 영역 -->
    <div class="form-section">
      <div class="form-inner">
        <!-- 로그인 폼 -->
        <template v-if="!isRegisterMode">
          <div class="form-header">
            <h2>로그인</h2>
            <p>계정 정보를 입력하여 로그인하세요</p>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="login-form"
            @keypress="handleKeyPress"
          >
            <el-form-item prop="username">
              <label class="input-label">사용자명</label>
              <el-input
                v-model="form.username"
                placeholder="사용자명을 입력하세요"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="password">
              <label class="input-label">비밀번호</label>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                size="large"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="form.remember">로그인 상태 유지</el-checkbox>
            </div>

            <Transition name="shake">
              <div v-if="authStore.error" class="error-message">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ authStore.error }}</span>
              </div>
            </Transition>

            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="authStore.isLoading"
              @click="handleLogin"
            >
              <span v-if="!authStore.isLoading">로그인</span>
              <span v-else>로그인 중...</span>
            </el-button>
          </el-form>

          <div class="form-footer">
            <p class="switch-mode-text">
              계정이 없으신가요?
              <button class="switch-mode-link" @click="switchToRegister">회원가입</button>
            </p>
            <span class="version-tag">v0.1.0</span>
          </div>
        </template>

        <!-- 회원가입 폼 -->
        <template v-else>
          <!-- 회원가입 성공 화면 -->
          <template v-if="registerSuccess">
            <div class="register-success">
              <div class="success-icon">
                <el-icon :size="64"><CircleCheckFilled /></el-icon>
              </div>
              <h2>회원가입 완료</h2>
              <p class="success-message">
                회원가입이 완료되었습니다.<br />
                관리자 승인 후 로그인이 가능합니다.
              </p>
              <el-button type="primary" size="large" class="login-button" @click="switchToLogin">
                로그인으로 돌아가기
              </el-button>
            </div>
          </template>

          <!-- 회원가입 폼 -->
          <template v-else>
            <div class="form-header">
              <h2>회원가입</h2>
              <p>관리자 계정을 등록하세요. 승인 후 로그인이 가능합니다.</p>
            </div>

            <el-form
              ref="registerFormRef"
              :model="registerForm"
              :rules="registerRules"
              class="register-form"
              @keypress="handleKeyPress"
            >
              <div class="form-row">
                <el-form-item prop="username" class="form-item-half">
                  <label class="input-label">아이디 <span class="required">*</span></label>
                  <el-input
                    v-model="registerForm.username"
                    placeholder="아이디 (4자 이상)"
                    size="large"
                    :prefix-icon="User"
                  />
                </el-form-item>

                <el-form-item prop="name" class="form-item-half">
                  <label class="input-label">이름 <span class="required">*</span></label>
                  <el-input
                    v-model="registerForm.name"
                    placeholder="이름"
                    size="large"
                    :prefix-icon="UserFilled"
                  />
                </el-form-item>
              </div>

              <el-form-item prop="email">
                <label class="input-label">이메일 <span class="required">*</span></label>
                <el-input
                  v-model="registerForm.email"
                  placeholder="이메일 주소"
                  size="large"
                  :prefix-icon="Message"
                />
              </el-form-item>

              <el-form-item prop="roleId">
                <label class="input-label">역할 <span class="required">*</span></label>
                <el-select
                  v-model="registerForm.roleId"
                  placeholder="역할을 선택하세요"
                  size="large"
                  style="width: 100%"
                  :loading="rolesLoading"
                >
                  <el-option
                    v-for="role in roles"
                    :key="role.id"
                    :label="role.description || role.name"
                    :value="role.id"
                  />
                </el-select>
              </el-form-item>

              <div class="form-row">
                <el-form-item prop="password" class="form-item-half">
                  <label class="input-label">비밀번호 <span class="required">*</span></label>
                  <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    size="large"
                    show-password
                    :prefix-icon="Lock"
                  />
                </el-form-item>

                <el-form-item prop="passwordConfirm" class="form-item-half">
                  <label class="input-label">비밀번호 확인 <span class="required">*</span></label>
                  <el-input
                    v-model="registerForm.passwordConfirm"
                    type="password"
                    placeholder="비밀번호 확인"
                    size="large"
                    show-password
                    :prefix-icon="Lock"
                  />
                </el-form-item>
              </div>

              <el-form-item prop="phone">
                <label class="input-label">연락처</label>
                <el-input
                  v-model="registerForm.phone"
                  placeholder="연락처 (선택)"
                  size="large"
                  :prefix-icon="Phone"
                />
              </el-form-item>

              <div class="form-row">
                <el-form-item prop="department" class="form-item-half">
                  <label class="input-label">부서</label>
                  <el-input
                    v-model="registerForm.department"
                    placeholder="부서 (선택)"
                    size="large"
                    :prefix-icon="OfficeBuilding"
                  />
                </el-form-item>

                <el-form-item prop="position" class="form-item-half">
                  <label class="input-label">직책</label>
                  <el-input
                    v-model="registerForm.position"
                    placeholder="직책 (선택)"
                    size="large"
                    :prefix-icon="Briefcase"
                  />
                </el-form-item>
              </div>

              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="registerLoading"
                @click="handleRegister"
              >
                <span v-if="!registerLoading">회원가입</span>
                <span v-else>가입 중...</span>
              </el-button>
            </el-form>

            <div class="form-footer">
              <p class="switch-mode-text">
                이미 계정이 있으신가요?
                <button class="switch-mode-link" @click="switchToLogin">로그인</button>
              </p>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  User,
  Lock,
  WarningFilled,
  DataAnalysis,
  UserFilled,
  Document,
  Message,
  Phone,
  OfficeBuilding,
  Briefcase,
  CircleCheckFilled,
} from '@element-plus/icons-vue'

export default {
  components: {
    User,
    Lock,
    WarningFilled,
    DataAnalysis,
    UserFilled,
    Document,
    Message,
    Phone,
    OfficeBuilding,
    Briefcase,
    CircleCheckFilled,
  },
}
</script>

<style scoped>

* {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

.login-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
}

/* ==================== 좌측 브랜딩 영역 ==================== */
.branding-section {
  width: 50%;
  min-width: 600px;
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.bg-pattern {
  position: absolute;
  inset: 0;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: rgba(99, 102, 241, 0.3);
  top: -200px;
  left: -200px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: rgba(6, 182, 212, 0.2);
  bottom: -200px;
  right: -200px;
}

.floating-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  animation: floatShape 15s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  right: 15%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 25%;
  border-radius: 50%;
  animation-delay: -5s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 25%;
  left: 20%;
  animation-delay: -10s;
}

@keyframes floatShape {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-30px) rotate(10deg); opacity: 0.5; }
}

.brand-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 60px 80px;
}

.brand-header {
  flex-shrink: 0;
}

.logo-mark {
  width: 64px;
  height: 64px;
  color: #818cf8;
}

.brand-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-title {
  font-size: 56px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.brand-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 32px 0;
  letter-spacing: 6px;
  text-transform: uppercase;
}

.brand-description {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0 0 48px 0;
}

.feature-row {
  display: flex;
  gap: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
}

.feature-item .el-icon {
  font-size: 20px;
  color: #818cf8;
}

.brand-footer {
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: 48px;
  margin-bottom: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #818cf8;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.powered-by {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}

/* ==================== 우측 로그인 폼 영역 ==================== */
.form-section {
  flex: 1;
  min-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: #fff;
}

.form-inner {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px 0;
}

.form-header p {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

:deep(.el-input) {
  --el-input-bg-color: #f8fafc;
  --el-input-border-color: #e2e8f0;
  --el-input-hover-border-color: #6366f1;
  --el-input-focus-border-color: #6366f1;
  --el-input-text-color: #1e293b;
  --el-input-placeholder-color: #94a3b8;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 6px 16px;
  box-shadow: none !important;
  background: var(--el-input-bg-color);
  border: 2px solid var(--el-input-border-color);
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--el-input-hover-border-color);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-input-focus-border-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
}

:deep(.el-input__prefix) {
  color: #94a3b8;
}

:deep(.el-input__inner) {
  height: 44px;
}

/* 브라우저 자동완성(autofill) 스타일 오버라이드 */
:deep(.el-input__inner:-webkit-autofill),
:deep(.el-input__inner:-webkit-autofill:hover),
:deep(.el-input__inner:-webkit-autofill:focus),
:deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #334155 inset !important;
  -webkit-text-fill-color: #f1f5f9 !important;
  transition: background-color 5000s ease-in-out 0s;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__error) {
  color: #ef4444;
  font-size: 12px;
  padding-top: 6px;
}

.form-options {
  margin-bottom: 32px;
}

:deep(.el-checkbox) {
  --el-checkbox-text-color: #64748b;
  --el-checkbox-font-size: 14px;
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
  border-color: #cbd5e1;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #6366f1;
  border-color: #6366f1;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 24px;
}

.shake-enter-active {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.login-button {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: #6366f1;
  border: none;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.form-footer {
  margin-top: 40px;
  text-align: center;
}

.version-tag {
  font-size: 12px;
  color: #94a3b8;
  padding: 6px 16px;
  background: #f1f5f9;
  border-radius: 20px;
}

/* ==================== 회원가입 폼 ==================== */
.switch-mode-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.switch-mode-link {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  transition: color 0.2s ease;
}

.switch-mode-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item-half {
  flex: 1;
}

.input-label .required {
  color: #ef4444;
}

.register-success {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  margin-bottom: 24px;
}

.success-icon .el-icon {
  color: #10b981;
}

.register-success h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.success-message {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

/* ==================== 반응형 ==================== */
@media (max-width: 1200px) {
  .branding-section {
    min-width: 500px;
    padding: 48px;
  }

  .brand-inner {
    padding: 48px;
  }

  .brand-title {
    font-size: 44px;
  }

  .brand-description {
    font-size: 18px;
  }
}

@media (max-width: 1024px) {
  .branding-section {
    width: 45%;
    min-width: 400px;
  }

  .brand-inner {
    padding: 40px;
  }

  .brand-title {
    font-size: 36px;
  }

  .feature-row {
    flex-direction: column;
    gap: 16px;
  }

  .stats-row {
    gap: 32px;
  }

  .stat-number {
    font-size: 22px;
  }
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
  }

  .branding-section {
    width: 100%;
    min-width: unset;
    min-height: 280px;
  }

  .brand-inner {
    padding: 32px 24px;
  }

  .brand-main {
    justify-content: flex-start;
  }

  .brand-title {
    font-size: 28px;
    margin-bottom: 4px;
  }

  .brand-subtitle {
    font-size: 10px;
    letter-spacing: 4px;
    margin-bottom: 0;
  }

  .brand-description,
  .feature-row,
  .brand-footer {
    display: none;
  }

  .form-section {
    min-width: unset;
    padding: 32px 24px;
  }

  .form-header h2 {
    font-size: 24px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-item-half {
    width: 100%;
  }
}
</style>
