/**
 * 사이트별 뷰 레지스트리
 * views/sites/ 아래의 디렉토리 구조를 동적으로 스캔하여
 * 어떤 사이트가 어떤 커스텀 뷰를 가지고 있는지 반환
 *
 * 새 폴더 구조: views/sites/{siteId}/{feature}/{ViewName}.vue
 * 예: views/sites/site1/board/BoardManagementView.vue
 */

// views/sites/ 아래의 모든 Vue 파일을 스캔
const siteModules = import.meta.glob('../views/sites/**/*.vue')

export interface SiteViewInfo {
  siteId: string
  views: string[] // feature/ViewName 형식
}

export interface SiteViewRegistry {
  sites: SiteViewInfo[]
  getAllSiteIds: () => string[]
  getSiteViews: (siteId: string) => string[]
  hasSiteView: (siteId: string, viewPath: string) => boolean
}

/**
 * 등록된 사이트 뷰 정보를 파싱하여 반환
 */
export function getSiteViewRegistry(): SiteViewRegistry {
  const siteMap = new Map<string, Set<string>>()

  // 모듈 경로 파싱: '../views/sites/{siteId}/{feature}/{ViewName}.vue'
  Object.keys(siteModules).forEach((path) => {
    // 예: ../views/sites/site1/board/BoardManagementView.vue
    const match = path.match(/\.\.\/views\/sites\/([^/]+)\/(.+)\.vue$/)
    if (match) {
      const [, siteId, viewPath] = match // viewPath = "board/BoardManagementView"
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, new Set())
      }
      siteMap.get(siteId)!.add(viewPath)
    }
  })

  // Map을 배열로 변환
  const sites: SiteViewInfo[] = Array.from(siteMap.entries()).map(([siteId, views]) => ({
    siteId,
    views: Array.from(views).sort(),
  }))

  return {
    sites,
    getAllSiteIds: () => sites.map((s) => s.siteId),
    getSiteViews: (siteId: string) => (siteMap.get(siteId) ? Array.from(siteMap.get(siteId)!) : []),
    hasSiteView: (siteId: string, viewPath: string) =>
      siteMap.get(siteId)?.has(viewPath) ?? false,
  }
}

/**
 * JSON 형태로 반환
 */
export function getSiteViewRegistryAsJson(): string {
  const registry = getSiteViewRegistry()
  return JSON.stringify(registry.sites, null, 2)
}

/**
 * 디버그용: 콘솔에 출력
 */
export function printSiteViewRegistry(): void {
  console.log('=== Site View Registry ===')
  console.log(getSiteViewRegistryAsJson())
}
