<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    // TODO: API 연동
    console.log('로그인:', form.value)
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>YSK CMS</h2>
          <p>관리자 로그인</p>
        </div>
      </template>

      <el-form :model="form" label-position="top">
        <el-form-item label="이메일">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="이메일을 입력하세요"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="비밀번호">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            size="large"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.remember">로그인 상태 유지</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            로그인
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0;
  color: #303133;
}

.login-header p {
  margin: 8px 0 0;
  color: #909399;
}
</style>
