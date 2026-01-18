<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { register, getRoles } from '@/api/auth'
import { getActiveSites, type SiteSimple } from '@/api/site'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { RoleDto } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

// 로그인/회원가입 모드 토글
const isRegisterMode = ref(false)
const registerLoading = ref(false)
const registerSuccess = ref(false)

// 사이트 목록
const sites = ref<SiteSimple[]>([])
const sitesLoading = ref(false)

// 역할 목록
const roles = ref<RoleDto[]>([])
const rolesLoading = ref(false)

const formRef = ref<FormInstance>()
const form = reactive({
  siteCode: '',
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
  siteCode: [{ required: true, message: '사이트를 선택해주세요', trigger: 'change' }],
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

// 사이트 목록 로드
const fetchSites = async () => {
  sitesLoading.value = true
  try {
    const response = await getActiveSites()
    if (response.data.success) {
      sites.value = response.data.data
      // 사이트가 하나만 있으면 자동 선택
      if (sites.value.length === 1) {
        form.siteCode = sites.value[0].code
      }
    }
  } catch (error) {
    console.error('사이트 목록 조회 실패:', error)
  } finally {
    sitesLoading.value = false
  }
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      const result = await authStore.login({
        siteCode: form.siteCode,
        username: form.username,
        password: form.password,
      })

      if (result.success) {
        router.push('/dashboard')
      }
    }
  })
}

// 페이지 로드 시 사이트 목록 조회
onMounted(() => {
  fetchSites()
})

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
            <el-form-item prop="siteCode">
              <label class="input-label">사이트</label>
              <el-select
                v-model="form.siteCode"
                placeholder="사이트를 선택하세요"
                size="large"
                style="width: 100%"
                :loading="sitesLoading"
              >
                <el-option
                  v-for="site in sites"
                  :key="site.code"
                  :label="site.name"
                  :value="site.code"
                />
              </el-select>
            </el-form-item>

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

<!-- CSS: public/css/views/login.css -->
