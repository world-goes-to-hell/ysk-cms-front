/**
 * 빌드 결과물 병합 스크립트
 * - User 앱: /dist/ (루트)
 * - Admin 앱: /dist/adm/
 */

import { existsSync, mkdirSync, rmSync, cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const userDist = join(rootDir, 'apps', 'user', 'dist')
const adminDist = join(rootDir, 'apps', 'admin', 'dist')
const outputDist = join(rootDir, 'dist')

console.log('📦 빌드 결과물 병합 시작...')

// 1. 기존 dist 폴더 삭제
if (existsSync(outputDist)) {
  console.log('🗑️  기존 dist 폴더 삭제...')
  rmSync(outputDist, { recursive: true, force: true })
}

// 2. dist 폴더 생성
mkdirSync(outputDist, { recursive: true })

// 3. User 앱 복사 (루트에)
if (existsSync(userDist)) {
  console.log('📁 User 앱 복사 중... (/ 경로)')
  cpSync(userDist, outputDist, { recursive: true })
} else {
  console.error('❌ User 앱 빌드 결과물이 없습니다:', userDist)
  process.exit(1)
}

// 4. Admin 앱 복사 (/adm 경로에)
const adminOutputDir = join(outputDist, 'adm')
if (existsSync(adminDist)) {
  console.log('📁 Admin 앱 복사 중... (/adm 경로)')
  mkdirSync(adminOutputDir, { recursive: true })
  cpSync(adminDist, adminOutputDir, { recursive: true })
} else {
  console.error('❌ Admin 앱 빌드 결과물이 없습니다:', adminDist)
  process.exit(1)
}

console.log('✅ 병합 완료!')
console.log(`   📂 출력 경로: ${outputDist}`)
console.log('   📄 User 앱: /')
console.log('   📄 Admin 앱: /adm/')
