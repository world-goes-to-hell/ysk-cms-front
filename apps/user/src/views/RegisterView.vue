<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
})
const isLoading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (form.value.password !== form.value.passwordConfirm) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // TODO: 실제 회원가입 API 연동
    console.log('Register:', form.value)
    router.push('/login')
  } catch (e) {
    error.value = '회원가입에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <RouterLink to="/" class="logo">YSK CMS</RouterLink>
        <h1>회원가입</h1>
        <p>새 계정을 만드세요</p>
      </div>

      <form @submit.prevent="handleSubmit" class="register-form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <label for="name">이름</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="이름을 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">이메일</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="이메일을 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인</label>
          <input
            id="passwordConfirm"
            v-model="form.passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isLoading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <div class="register-footer">
        <p>
          이미 계정이 있으신가요?
          <RouterLink to="/login">로그인</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 24px;
}

.register-container {
  background: #fff;
  border-radius: 16px;
  padding: 48px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
  text-decoration: none;
}

.register-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 24px 0 8px 0;
}

.register-header p {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #4f46e5;
}

.btn-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
}

.register-footer p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.register-footer a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
  text-decoration: underline;
}
</style>
