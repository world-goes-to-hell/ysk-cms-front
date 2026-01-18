<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const isVisible = ref(false)

onMounted(() => {
  // Trigger animation after mount
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})
</script>

<template>
  <section class="hero">
    <!-- Background Effects -->
    <div class="hero__bg">
      <div class="hero__gradient"></div>
      <div class="hero__mesh"></div>
      <div class="hero__grid"></div>

      <!-- Floating Orbs -->
      <div class="hero__orb hero__orb--1"></div>
      <div class="hero__orb hero__orb--2"></div>
      <div class="hero__orb hero__orb--3"></div>

      <!-- Particles -->
      <div class="hero__particles">
        <span v-for="n in 20" :key="n" class="hero__particle"></span>
      </div>
    </div>

    <div class="hero__container" :class="{ 'is-visible': isVisible }">
      <!-- Badge -->
      <div class="hero__badge">
        <span class="hero__badge-dot"></span>
        <span class="hero__badge-text">새로운 버전 출시</span>
        <svg class="hero__badge-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>

      <!-- Heading -->
      <h1 class="hero__title">
        <span class="hero__title-line">콘텐츠의</span>
        <span class="hero__title-line hero__title-line--gradient">무한한 가능성을</span>
        <span class="hero__title-line">실현하세요</span>
      </h1>

      <!-- Description -->
      <p class="hero__description">
        YSK CMS와 함께 웹사이트 콘텐츠를 손쉽게 관리하세요.<br class="hero__br" />
        직관적인 인터페이스, 강력한 기능, 무한한 확장성을 제공합니다.
      </p>

      <!-- CTA Buttons -->
      <div class="hero__actions">
        <RouterLink to="/register" class="hero__btn hero__btn--primary">
          <span>무료로 시작하기</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </RouterLink>
        <RouterLink to="/about" class="hero__btn hero__btn--secondary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>데모 보기</span>
        </RouterLink>
      </div>

      <!-- Stats -->
      <div class="hero__stats">
        <div class="hero__stat">
          <span class="hero__stat-value">10K+</span>
          <span class="hero__stat-label">활성 사용자</span>
        </div>
        <div class="hero__stat-divider"></div>
        <div class="hero__stat">
          <span class="hero__stat-value">99.9%</span>
          <span class="hero__stat-label">가동률</span>
        </div>
        <div class="hero__stat-divider"></div>
        <div class="hero__stat">
          <span class="hero__stat-value">24/7</span>
          <span class="hero__stat-label">기술 지원</span>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="hero__scroll">
      <div class="hero__scroll-mouse">
        <div class="hero__scroll-wheel"></div>
      </div>
      <span class="hero__scroll-text">스크롤하여 더 알아보기</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: calc(var(--header-height) + var(--space-16)) var(--space-6) var(--space-16);
}

/* Background */
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e1b4b 25%,
    #312e81 50%,
    #3730a3 75%,
    #1e1b4b 100%
  );
}

html.dark .hero__gradient {
  background: linear-gradient(
    135deg,
    #020617 0%,
    #0f172a 25%,
    #1e1b4b 50%,
    #1e293b 75%,
    #0f172a 100%
  );
}

.hero__mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(at 20% 30%, rgba(99, 102, 241, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 20%, rgba(6, 182, 212, 0.3) 0px, transparent 50%),
    radial-gradient(at 40% 80%, rgba(168, 85, 247, 0.3) 0px, transparent 50%),
    radial-gradient(at 90% 70%, rgba(99, 102, 241, 0.2) 0px, transparent 50%);
  animation: meshMove 20s ease-in-out infinite;
}

@keyframes meshMove {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-2%, 2%); }
  50% { transform: translate(2%, -2%); }
  75% { transform: translate(-1%, -1%); }
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 50% at 50% 50%, black 40%, transparent 100%);
}

/* Floating Orbs */
.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: orbFloat 15s ease-in-out infinite;
}

.hero__orb--1 {
  width: 400px;
  height: 400px;
  background: rgba(99, 102, 241, 0.4);
  top: 10%;
  left: -10%;
  animation-delay: 0s;
}

.hero__orb--2 {
  width: 300px;
  height: 300px;
  background: rgba(6, 182, 212, 0.3);
  top: 60%;
  right: -5%;
  animation-delay: -5s;
}

.hero__orb--3 {
  width: 250px;
  height: 250px;
  background: rgba(168, 85, 247, 0.3);
  bottom: 10%;
  left: 30%;
  animation-delay: -10s;
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 30px) scale(0.9);
  }
}

/* Particles */
.hero__particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero__particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: particleFloat 20s linear infinite;
}

.hero__particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.hero__particle:nth-child(2) { left: 20%; animation-delay: -2s; }
.hero__particle:nth-child(3) { left: 30%; animation-delay: -4s; }
.hero__particle:nth-child(4) { left: 40%; animation-delay: -6s; }
.hero__particle:nth-child(5) { left: 50%; animation-delay: -8s; }
.hero__particle:nth-child(6) { left: 60%; animation-delay: -10s; }
.hero__particle:nth-child(7) { left: 70%; animation-delay: -12s; }
.hero__particle:nth-child(8) { left: 80%; animation-delay: -14s; }
.hero__particle:nth-child(9) { left: 90%; animation-delay: -16s; }
.hero__particle:nth-child(10) { left: 15%; animation-delay: -1s; }
.hero__particle:nth-child(11) { left: 25%; animation-delay: -3s; }
.hero__particle:nth-child(12) { left: 35%; animation-delay: -5s; }
.hero__particle:nth-child(13) { left: 45%; animation-delay: -7s; }
.hero__particle:nth-child(14) { left: 55%; animation-delay: -9s; }
.hero__particle:nth-child(15) { left: 65%; animation-delay: -11s; }
.hero__particle:nth-child(16) { left: 75%; animation-delay: -13s; }
.hero__particle:nth-child(17) { left: 85%; animation-delay: -15s; }
.hero__particle:nth-child(18) { left: 5%; animation-delay: -17s; }
.hero__particle:nth-child(19) { left: 95%; animation-delay: -18s; }
.hero__particle:nth-child(20) { left: 50%; animation-delay: -19s; }

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

/* Container */
.hero__container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  text-align: center;
  color: white;
}

/* Animation states */
.hero__container .hero__badge,
.hero__container .hero__title-line,
.hero__container .hero__description,
.hero__container .hero__actions,
.hero__container .hero__stats {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero__container.is-visible .hero__badge { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
.hero__container.is-visible .hero__title-line:nth-child(1) { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }
.hero__container.is-visible .hero__title-line:nth-child(2) { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }
.hero__container.is-visible .hero__title-line:nth-child(3) { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }
.hero__container.is-visible .hero__description { opacity: 1; transform: translateY(0); transition-delay: 0.5s; }
.hero__container.is-visible .hero__actions { opacity: 1; transform: translateY(0); transition-delay: 0.6s; }
.hero__container.is-visible .hero__stats { opacity: 1; transform: translateY(0); transition-delay: 0.7s; }

/* Badge */
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hero__badge:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  background: var(--color-success-500);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.hero__badge-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.hero__badge-arrow {
  width: 16px;
  height: 16px;
  opacity: 0.7;
  transition: transform var(--transition-fast);
}

.hero__badge:hover .hero__badge-arrow {
  transform: translateX(3px);
}

/* Title */
.hero__title {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: var(--font-extrabold);
  line-height: 1.1;
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-6);
}

.hero__title-line {
  display: block;
}

.hero__title-line--gradient {
  background: linear-gradient(135deg, #a5b4fc 0%, #67e8f9 50%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Description */
.hero__description {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: var(--space-10);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero__br {
  display: none;
}

/* Actions */
.hero__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-16);
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  text-decoration: none;
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.hero__btn svg {
  width: 20px;
  height: 20px;
  transition: transform var(--transition-fast);
}

.hero__btn--primary {
  background: white;
  color: var(--color-primary-600);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.hero__btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.hero__btn--primary:hover svg {
  transform: translateX(4px);
}

.hero__btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.hero__btn--secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Stats */
.hero__stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}

.hero__stat {
  text-align: center;
}

.hero__stat-value {
  display: block;
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: white;
  margin-bottom: var(--space-1);
}

.hero__stat-label {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.6);
}

.hero__stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* Scroll Indicator */
.hero__scroll {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: rgba(255, 255, 255, 0.5);
  animation: fadeIn 1s ease 1.5s both;
}

.hero__scroll-mouse {
  width: 24px;
  height: 38px;
  border: 2px solid currentColor;
  border-radius: 12px;
  position: relative;
}

.hero__scroll-wheel {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 8px;
  background: currentColor;
  border-radius: 2px;
  animation: scrollWheel 2s ease-in-out infinite;
}

@keyframes scrollWheel {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-50%) translateY(10px);
    opacity: 0;
  }
}

.hero__scroll-text {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding-top: calc(var(--header-height) + var(--space-12));
    padding-bottom: var(--space-24);
  }

  .hero__title {
    font-size: 2.25rem;
  }

  .hero__description {
    font-size: var(--text-base);
  }

  .hero__br {
    display: inline;
  }

  .hero__actions {
    flex-direction: column;
    width: 100%;
  }

  .hero__btn {
    width: 100%;
    justify-content: center;
  }

  .hero__stats {
    flex-direction: column;
    gap: var(--space-6);
  }

  .hero__stat-divider {
    width: 60px;
    height: 1px;
  }

  .hero__scroll {
    display: none;
  }

  .hero__orb--1 {
    width: 200px;
    height: 200px;
  }

  .hero__orb--2 {
    width: 150px;
    height: 150px;
  }

  .hero__orb--3 {
    width: 120px;
    height: 120px;
  }
}
</style>
