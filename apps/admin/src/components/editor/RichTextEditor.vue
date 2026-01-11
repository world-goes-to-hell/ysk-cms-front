<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Link,
  List,
  BlockQuote,
  Image,
  ImageUpload,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageCaption,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Alignment,
  Indent,
  IndentBlock,
  Font,
  HorizontalLine,
  CodeBlock,
  Code,
  RemoveFormat,
  SourceEditing,
  GeneralHtmlSupport,
  type EditorConfig,
  type UploadAdapter,
  type FileLoader,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  minHeight?: string
  siteCode: string
  uploadUrl?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorInstance = ref<ClassicEditor | null>(null)
const isReady = ref(false)

// API Base URL 가져오기
const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  return baseUrl.replace(/\/api$/, '') // '/api' 제거하고 호스트만 반환
}

// 파일 URL 변환 (상대 경로를 절대 경로로)
const convertFileUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('/api')) {
    return getApiBaseUrl() + url
  }
  return url
}

// 커스텀 업로드 어댑터 클래스
class CustomUploadAdapter implements UploadAdapter {
  private loader: FileLoader
  private siteCode: string
  private xhr: XMLHttpRequest | null = null

  constructor(loader: FileLoader, siteCode: string) {
    this.loader = loader
    this.siteCode = siteCode
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          if (!file) {
            reject('No file to upload')
            return
          }

          const xhr = new XMLHttpRequest()
          this.xhr = xhr

          // 전체 URL 사용
          const uploadUrl = `${getApiBaseUrl()}/api/sites/${this.siteCode}/atch-files/upload`
          xhr.open('POST', uploadUrl, true)
          xhr.responseType = 'json'

          // 인증 토큰 추가
          const token = localStorage.getItem('accessToken')
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          }

          xhr.addEventListener('load', () => {
            const response = xhr.response

            if (!response || xhr.status !== 201) {
              return reject(response?.message || '업로드에 실패했습니다.')
            }

            // URL을 절대 경로로 변환
            const imageUrl = convertFileUrl(response.data.url)
            resolve({
              default: imageUrl,
            })
          })

          xhr.addEventListener('error', () => reject('업로드 중 오류가 발생했습니다.'))
          xhr.addEventListener('abort', () => reject('업로드가 취소되었습니다.'))

          // 업로드 진행률
          if (xhr.upload) {
            xhr.upload.addEventListener('progress', (evt) => {
              if (evt.lengthComputable) {
                this.loader.uploadTotal = evt.total
                this.loader.uploaded = evt.loaded
              }
            })
          }

          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'IMAGE')

          xhr.send(formData)
        }),
    )
  }

  abort(): void {
    if (this.xhr) {
      this.xhr.abort()
    }
  }
}

// 업로드 어댑터 플러그인
function CustomUploadAdapterPlugin(editor: ClassicEditor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: FileLoader) => {
    return new CustomUploadAdapter(loader, props.siteCode)
  }
}

// 에디터 설정
const editorConfig: EditorConfig = {
  plugins: [
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading,
    Link,
    List,
    BlockQuote,
    Image,
    ImageUpload,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageCaption,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    MediaEmbed,
    Alignment,
    Indent,
    IndentBlock,
    Font,
    HorizontalLine,
    CodeBlock,
    Code,
    RemoveFormat,
    SourceEditing,
    GeneralHtmlSupport,
    CustomUploadAdapterPlugin,
  ],
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'fontSize',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'alignment',
      '|',
      'bulletedList',
      'numberedList',
      'outdent',
      'indent',
      '|',
      'link',
      'insertImage',
      'insertTable',
      'blockQuote',
      'codeBlock',
      'horizontalLine',
      '|',
      'removeFormat',
      'sourceEditing',
    ],
    shouldNotGroupWhenFull: true,
  },
  heading: {
    options: [
      { model: 'paragraph', title: '본문', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: '제목 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: '제목 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: '제목 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: '제목 4', class: 'ck-heading_heading4' },
    ],
  },
  fontSize: {
    options: [10, 12, 14, 'default', 18, 20, 24, 28, 32],
  },
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      '|',
      'toggleImageCaption',
      'imageTextAlternative',
      '|',
      'resizeImage',
    ],
    resizeOptions: [
      { name: 'resizeImage:original', value: null, label: '원본 크기' },
      { name: 'resizeImage:25', value: '25', label: '25%' },
      { name: 'resizeImage:50', value: '50', label: '50%' },
      { name: 'resizeImage:75', value: '75', label: '75%' },
    ],
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
  },
  placeholder: props.placeholder || '내용을 입력하세요...',
  licenseKey: 'GPL',
  language: 'ko',
  htmlSupport: {
    allow: [
      {
        name: /.*/,
        attributes: true,
        classes: true,
        styles: true,
      },
    ],
  },
}

// 에디터 준비 완료
const onReady = (editor: ClassicEditor) => {
  editorInstance.value = editor
  isReady.value = true
}

// 값 변경 핸들러
const onInput = (value: string) => {
  emit('update:modelValue', value)
}

// props 값이 외부에서 변경될 때 에디터 동기화
watch(
  () => props.modelValue,
  (newVal) => {
    if (editorInstance.value && isReady.value) {
      const currentData = editorInstance.value.getData()
      if (currentData !== newVal) {
        editorInstance.value.setData(newVal || '')
      }
    }
  },
)
</script>

<template>
  <div class="rich-text-editor" :style="{ '--editor-min-height': minHeight || '300px' }">
    <Ckeditor
      :editor="ClassicEditor"
      :config="editorConfig"
      :model-value="modelValue"
      @ready="onReady"
      @update:model-value="onInput"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  width: 100%;
}

.rich-text-editor :deep(.ck-editor__editable) {
  min-height: var(--editor-min-height);
  background: var(--bg-primary);
  border-color: var(--border-color) !important;
}

.rich-text-editor :deep(.ck-editor__editable:focus) {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
}

.rich-text-editor :deep(.ck-toolbar) {
  background: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
  border-radius: 12px 12px 0 0 !important;
}

.rich-text-editor :deep(.ck-editor__main > .ck-editor__editable) {
  border-radius: 0 0 12px 12px !important;
}

.rich-text-editor :deep(.ck-content) {
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.7;
}

.rich-text-editor :deep(.ck-content h1) {
  font-size: 2em;
  margin: 0.67em 0;
}

.rich-text-editor :deep(.ck-content h2) {
  font-size: 1.5em;
  margin: 0.75em 0;
}

.rich-text-editor :deep(.ck-content h3) {
  font-size: 1.17em;
  margin: 0.83em 0;
}

.rich-text-editor :deep(.ck-content blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
}

.rich-text-editor :deep(.ck-content pre) {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.rich-text-editor :deep(.ck-content code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.rich-text-editor :deep(.ck-content img) {
  max-width: 100%;
  height: auto;
}

.rich-text-editor :deep(.ck-content table) {
  border-collapse: collapse;
  width: 100%;
}

.rich-text-editor :deep(.ck-content th),
.rich-text-editor :deep(.ck-content td) {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
}

.rich-text-editor :deep(.ck-content th) {
  background: var(--bg-tertiary);
  font-weight: 600;
}

/* 다크모드 지원 */
:root {
  --ck-color-base-background: var(--bg-secondary);
  --ck-color-base-foreground: var(--bg-primary);
  --ck-color-base-border: var(--border-color);
  --ck-color-base-text: var(--text-primary);
  --ck-color-toolbar-background: var(--bg-secondary);
  --ck-color-toolbar-border: var(--border-color);
  --ck-color-button-default-background: transparent;
  --ck-color-button-default-hover-background: var(--bg-tertiary);
  --ck-color-button-on-background: var(--bg-tertiary);
  --ck-color-dropdown-panel-background: var(--bg-secondary);
  --ck-color-dropdown-panel-border: var(--border-color);
  --ck-color-input-background: var(--bg-primary);
  --ck-color-input-border: var(--border-color);
  --ck-color-input-text: var(--text-primary);
  --ck-color-list-background: var(--bg-secondary);
  --ck-color-list-button-hover-background: var(--bg-tertiary);
  --ck-color-panel-background: var(--bg-secondary);
  --ck-color-panel-border: var(--border-color);
}

.rich-text-editor :deep(.ck.ck-editor__main > .ck-editor__editable) {
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-toolbar) {
  background: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
}

.rich-text-editor :deep(.ck.ck-button),
.rich-text-editor :deep(.ck.ck-dropdown__button) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-button:not(.ck-color-grid__tile):hover),
.rich-text-editor :deep(.ck.ck-dropdown__button:hover) {
  background: var(--bg-tertiary) !important;
}

.rich-text-editor :deep(.ck.ck-button.ck-on:not(.ck-color-grid__tile)) {
  background: var(--bg-tertiary) !important;
  color: #6366f1 !important;
}

.rich-text-editor :deep(.ck.ck-dropdown__panel) {
  background: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
}

.rich-text-editor :deep(.ck.ck-reset.ck-list) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck.ck-list) {
  background: var(--bg-secondary) !important;
}

/* 헤딩 드롭다운 강제 스타일 */
.rich-text-editor :deep(.ck-heading-dropdown .ck-dropdown__panel) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck-heading-dropdown .ck-list) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck-heading-dropdown .ck-list__item) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck-heading-dropdown .ck-button) {
  background: transparent !important;
}

.rich-text-editor :deep(.ck-heading-dropdown .ck-button:hover) {
  background: var(--bg-tertiary) !important;
}

.rich-text-editor :deep(.ck.ck-list__item .ck-button) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-list__item .ck-button:hover) {
  background: var(--bg-tertiary) !important;
}

.rich-text-editor :deep(.ck.ck-list__item .ck-button.ck-on) {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
}

/* 드롭다운 내 텍스트 (색상 타일 제외) */
.rich-text-editor :deep(.ck.ck-dropdown__panel .ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-heading-dropdown .ck-list__item .ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-font-size-dropdown .ck-list__item .ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-dropdown__panel .ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-list .ck-button .ck-button__label) {
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-list .ck-button.ck-on .ck-button__label) {
  color: #6366f1 !important;
}

/* 입력 필드 (링크 등) */
.rich-text-editor :deep(.ck.ck-input) {
  background: var(--bg-primary) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
}

.rich-text-editor :deep(.ck.ck-labeled-field-view__input-wrapper) {
  background: var(--bg-primary) !important;
}

.rich-text-editor :deep(.ck.ck-label) {
  color: var(--text-secondary) !important;
}

/* 풍선 툴바, 패널 */
.rich-text-editor :deep(.ck.ck-balloon-panel) {
  background: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
}

.rich-text-editor :deep(.ck.ck-balloon-panel .ck-toolbar) {
  background: var(--bg-secondary) !important;
}

/* 테이블 셀 선택 */
.rich-text-editor :deep(.ck.ck-widget.ck-widget_selected),
.rich-text-editor :deep(.ck.ck-widget.ck-widget_selected:hover) {
  outline-color: #6366f1 !important;
}

/* 소스 편집 모드 */
.rich-text-editor :deep(.ck-source-editing-area textarea) {
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}

/* 폰트 색상 선택기 */
.rich-text-editor :deep(.ck.ck-color-grid) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck.ck-color-grid__tile:hover) {
  box-shadow: inset 0 0 0 1px var(--border-color) !important;
}

/* 표 속성 패널 */
.rich-text-editor :deep(.ck.ck-form) {
  background: var(--bg-secondary) !important;
}

.rich-text-editor :deep(.ck.ck-form .ck-button) {
  color: var(--text-primary) !important;
}
</style>

<!-- 전역 스타일 (CKEditor 드롭다운은 body에 렌더링됨) -->
<style>
/* CKEditor 드롭다운 패널 - 전역 스타일 */
.ck.ck-dropdown__panel {
  background: var(--bg-secondary, #1e1e2d) !important;
  border-color: var(--border-color, #2d2d3d) !important;
}

.ck.ck-dropdown__panel .ck-list {
  background: var(--bg-secondary, #1e1e2d) !important;
}

.ck.ck-dropdown__panel .ck-list__item {
  background: transparent !important;
}

.ck.ck-dropdown__panel .ck-button:not(.ck-color-grid__tile) {
  background: transparent !important;
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-dropdown__panel .ck-button:not(.ck-color-grid__tile):hover {
  background: var(--bg-tertiary, #2a2a3d) !important;
}

.ck.ck-dropdown__panel .ck-button.ck-on:not(.ck-color-grid__tile) {
  background: rgba(99, 102, 241, 0.15) !important;
  color: #6366f1 !important;
}

.ck.ck-dropdown__panel .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-dropdown__panel .ck-button.ck-on .ck-button__label {
  color: #6366f1 !important;
}

/* 헤딩 프리뷰 스타일 유지하면서 색상만 변경 */
.ck.ck-heading-dropdown .ck-heading_heading1 .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-heading-dropdown .ck-heading_heading2 .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-heading-dropdown .ck-heading_heading3 .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-heading-dropdown .ck-heading_heading4 .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-heading-dropdown .ck-heading_paragraph .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

/* 폰트 크기 드롭다운 */
.ck.ck-font-size-dropdown .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

/* 색상 선택기 */
.ck.ck-color-ui-dropdown .ck-dropdown__panel {
  background: var(--bg-secondary, #1e1e2d) !important;
}

.ck.ck-color-grid {
  background: var(--bg-secondary, #1e1e2d) !important;
}

.ck.ck-color-grid__tile {
  border-color: var(--border-color, #2d2d3d) !important;
}

/* 색상 타일 자체는 배경색 유지 */
.ck.ck-color-grid__tile:not(.ck-color-selector__color-tile_selected) {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.ck.ck-color-grid__tile:hover {
  box-shadow: inset 0 0 0 2px var(--text-primary, #e0e0e0) !important;
}

/* 색상 라벨 */
.ck.ck-color-selector__color-picker {
  background: var(--bg-secondary, #1e1e2d) !important;
}

.ck.ck-color-selector .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

/* 색상 제거 버튼 */
.ck.ck-color-selector__remove-color {
  background: var(--bg-secondary, #1e1e2d) !important;
}

.ck.ck-color-selector__remove-color .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-color-selector__remove-color:hover {
  background: var(--bg-tertiary, #2a2a3d) !important;
}

/* 풍선 패널 */
.ck.ck-balloon-panel {
  background: var(--bg-secondary, #1e1e2d) !important;
  border-color: var(--border-color, #2d2d3d) !important;
}

.ck.ck-balloon-panel .ck-button {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-balloon-panel .ck-button__label {
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-balloon-panel .ck-input {
  background: var(--bg-primary, #141420) !important;
  border-color: var(--border-color, #2d2d3d) !important;
  color: var(--text-primary, #e0e0e0) !important;
}

.ck.ck-balloon-panel .ck-labeled-field-view__input-wrapper {
  background: var(--bg-primary, #141420) !important;
  border-color: var(--border-color, #2d2d3d) !important;
}

.ck.ck-balloon-panel .ck-label {
  color: var(--text-secondary, #a0a0a0) !important;
}
</style>
