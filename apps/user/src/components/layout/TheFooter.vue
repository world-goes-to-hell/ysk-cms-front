<script setup lang="ts">
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()

const footerLinks = {
  product: {
    title: '제품',
    links: [
      { label: '기능', path: '/features' },
      { label: '가격', path: '/pricing' },
      { label: '업데이트', path: '/updates' },
      { label: '로드맵', path: '/roadmap' },
    ]
  },
  resources: {
    title: '리소스',
    links: [
      { label: '문서', path: '/docs' },
      { label: '튜토리얼', path: '/tutorials' },
      { label: 'API 레퍼런스', path: '/api' },
      { label: '커뮤니티', path: '/community' },
    ]
  },
  company: {
    title: '회사',
    links: [
      { label: '소개', path: '/about' },
      { label: '블로그', path: '/blog' },
      { label: '채용', path: '/careers' },
      { label: '연락처', path: '/contact' },
    ]
  },
  legal: {
    title: '법적 고지',
    links: [
      { label: '개인정보처리방침', path: '/privacy' },
      { label: '이용약관', path: '/terms' },
      { label: '쿠키 정책', path: '/cookies' },
    ]
  }
}

const socialLinks = [
  { icon: 'github', url: 'https://github.com', label: 'GitHub' },
  { icon: 'twitter', url: 'https://twitter.com', label: 'Twitter' },
  { icon: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: 'youtube', url: 'https://youtube.com', label: 'YouTube' },
]
</script>

<template>
  <footer class="footer">
    <!-- CTA Section -->
    <div class="footer__cta">
      <div class="footer__cta-container">
        <div class="footer__cta-content">
          <h2 class="footer__cta-title">
            지금 바로 시작하세요
          </h2>
          <p class="footer__cta-description">
            무료로 YSK CMS를 체험하고, 콘텐츠 관리의 새로운 경험을 만나보세요.
          </p>
        </div>
        <div class="footer__cta-actions">
          <RouterLink to="/register" class="footer__cta-btn footer__cta-btn--primary">
            무료 체험 시작
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </RouterLink>
          <RouterLink to="/contact" class="footer__cta-btn footer__cta-btn--secondary">
            문의하기
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Main Footer -->
    <div class="footer__main">
      <div class="footer__container">
        <div class="footer__grid">
          <!-- Brand -->
          <div class="footer__brand">
            <RouterLink to="/" class="footer__logo">
              <div class="footer__logo-icon">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.9" />
                  <rect x="18" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
                  <rect x="2" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.6" />
                  <rect x="18" y="18" width="12" height="12" rx="3" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <span class="footer__logo-text">YSK<span class="footer__logo-accent">CMS</span></span>
            </RouterLink>
            <p class="footer__brand-description">
              강력하고 유연한 콘텐츠 관리 시스템으로<br />
              웹사이트를 더 쉽게 관리하세요.
            </p>
            <!-- Social Links -->
            <div class="footer__social">
              <a
                v-for="social in socialLinks"
                :key="social.icon"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="footer__social-link"
                :aria-label="social.label"
              >
                <!-- GitHub -->
                <svg v-if="social.icon === 'github'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <!-- Twitter -->
                <svg v-else-if="social.icon === 'twitter'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <!-- LinkedIn -->
                <svg v-else-if="social.icon === 'linkedin'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <!-- YouTube -->
                <svg v-else-if="social.icon === 'youtube'" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Links -->
          <div class="footer__links">
            <div v-for="(section, key) in footerLinks" :key="key" class="footer__links-section">
              <h3 class="footer__links-title">{{ section.title }}</h3>
              <ul class="footer__links-list">
                <li v-for="link in section.links" :key="link.path">
                  <RouterLink :to="link.path" class="footer__link">
                    {{ link.label }}
                  </RouterLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer__bottom">
      <div class="footer__container">
        <div class="footer__bottom-content">
          <p class="footer__copyright">
            &copy; {{ currentYear }} YSK CMS. All rights reserved.
          </p>
          <div class="footer__bottom-links">
            <RouterLink to="/privacy">개인정보처리방침</RouterLink>
            <span class="footer__bottom-divider">·</span>
            <RouterLink to="/terms">이용약관</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
}

.footer__container {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* CTA Section */
.footer__cta {
  background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-accent-600) 100%);
  padding: var(--space-16) var(--space-6);
  position: relative;
  overflow: hidden;
}

.footer__cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
}

.footer__cta-container {
  max-width: var(--container-xl);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  position: relative;
  z-index: 1;
}

.footer__cta-content {
  flex: 1;
}

.footer__cta-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: white;
  margin-bottom: var(--space-2);
}

.footer__cta-description {
  font-size: var(--text-lg);
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.footer__cta-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.footer__cta-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  text-decoration: none;
  border-radius: var(--radius-xl);
  transition: all var(--transition-fast);
}

.footer__cta-btn svg {
  width: 20px;
  height: 20px;
  transition: transform var(--transition-fast);
}

.footer__cta-btn--primary {
  background: white;
  color: var(--color-primary-600);
}

.footer__cta-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.footer__cta-btn--primary:hover svg {
  transform: translateX(4px);
}

.footer__cta-btn--secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.footer__cta-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Main Footer */
.footer__main {
  padding: var(--space-16) 0;
}

.footer__grid {
  display: grid;
  grid-template-columns: 1.5fr 2.5fr;
  gap: var(--space-16);
}

/* Brand */
.footer__brand {
  max-width: 320px;
}

.footer__logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  margin-bottom: var(--space-4);
}

.footer__logo-icon {
  width: 36px;
  height: 36px;
  color: var(--color-primary-500);
}

.footer__logo-text {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.footer__logo-accent {
  color: var(--color-primary-500);
}

.footer__brand-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-6);
}

/* Social Links */
.footer__social {
  display: flex;
  gap: var(--space-3);
}

.footer__social-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.footer__social-link:hover {
  background: var(--color-primary-500);
  color: white;
  transform: translateY(-2px);
}

.footer__social-link svg {
  width: 18px;
  height: 18px;
}

/* Links */
.footer__links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
}

.footer__links-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  margin-bottom: var(--space-4);
}

.footer__links-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer__link {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer__link:hover {
  color: var(--color-primary-500);
}

/* Bottom Bar */
.footer__bottom {
  border-top: 1px solid var(--border-light);
  padding: var(--space-6) 0;
}

.footer__bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer__copyright {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.footer__bottom-links {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.footer__bottom-links a {
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer__bottom-links a:hover {
  color: var(--color-primary-500);
}

.footer__bottom-divider {
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 1024px) {
  .footer__cta-container {
    flex-direction: column;
    text-align: center;
  }

  .footer__cta-actions {
    flex-direction: column;
    width: 100%;
    max-width: 320px;
  }

  .footer__cta-btn {
    width: 100%;
    justify-content: center;
  }

  .footer__grid {
    grid-template-columns: 1fr;
    gap: var(--space-12);
  }

  .footer__brand {
    max-width: none;
    text-align: center;
  }

  .footer__social {
    justify-content: center;
  }

  .footer__links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .footer__cta {
    padding: var(--space-12) var(--space-4);
  }

  .footer__cta-title {
    font-size: var(--text-2xl);
  }

  .footer__main {
    padding: var(--space-12) 0;
  }

  .footer__links {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
  }

  .footer__bottom-content {
    flex-direction: column;
    gap: var(--space-4);
    text-align: center;
  }
}
</style>
