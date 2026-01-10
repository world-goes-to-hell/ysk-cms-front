<script setup lang="ts">
</script>

<template>
  <div class="home">
    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-container">
        <h1>YSK CMS에 오신 것을 환영합니다</h1>
        <p>강력하고 유연한 콘텐츠 관리 시스템</p>
        <div class="hero-buttons">
          <RouterLink to="/register" class="btn btn-primary btn-lg">
            시작하기
          </RouterLink>
          <RouterLink to="/about" class="btn btn-outline btn-lg">
            자세히 알아보기
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- 기능 소개 섹션 -->
    <section class="features">
      <div class="features-container">
        <h2>주요 기능</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h3>콘텐츠 관리</h3>
            <p>직관적인 인터페이스로 콘텐츠를 쉽게 관리하세요.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>사용자 관리</h3>
            <p>권한 기반의 사용자 관리 시스템을 제공합니다.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>분석 도구</h3>
            <p>상세한 통계와 분석 도구를 활용하세요.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
}

.hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  padding: 120px 24px;
  text-align: center;
}

.hero-container {
  max-width: 800px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.hero p {
  font-size: 20px;
  opacity: 0.9;
  margin: 0 0 32px 0;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 17px;
}

.btn-primary {
  background: #fff;
  color: #6366f1;
}

.btn-primary:hover {
  background: #f8fafc;
}

.btn-outline {
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: #fff;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

.features {
  padding: 80px 24px;
  background: #f9fafb;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.features h2 {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 48px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.feature-card p {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 32px;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
