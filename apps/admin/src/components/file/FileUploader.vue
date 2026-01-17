<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadAtchFile, uploadMultipleAtchFiles, deleteAtchFile, downloadAtchFile } from '@/api/atchFile'
import { getFileUrl } from '@/api/index'
import type { AtchFileDto, AtchFileType } from '@/types/atchFile'

const props = withDefaults(
  defineProps<{
    modelValue: AtchFileDto[]
    siteCode: string
    multiple?: boolean
    accept?: string
    maxSize?: number // MB 단위
    maxFiles?: number
    fileType?: AtchFileType
    showPreview?: boolean
  }>(),
  {
    multiple: true,
    accept: '*/*',
    maxSize: 10, // 기본 10MB
    maxFiles: 10,
    showPreview: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: AtchFileDto[]): void
  (e: 'upload', file: AtchFileDto): void
  (e: 'delete', file: AtchFileDto): void
}>()

const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 파일 목록
const files = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 파일 크기 포맷
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 파일 아이콘 결정
const getFileIcon = (file: AtchFileDto): string => {
  const type = file.type || 'OTHER'
  const icons: Record<string, string> = {
    IMAGE: 'mdi-file-image-outline',
    VIDEO: 'mdi-file-video-outline',
    AUDIO: 'mdi-file-music-outline',
    DOCUMENT: 'mdi-file-document-outline',
    ARCHIVE: 'mdi-folder-zip-outline',
    OTHER: 'mdi-file-outline',
  }
  return icons[type] || icons.OTHER
}

// 이미지 여부 확인
const isImage = (file: AtchFileDto): boolean => {
  return file.type === 'IMAGE' || file.mimeType?.startsWith('image/')
}

// 파일 선택 다이얼로그 열기
const openFileDialog = () => {
  fileInputRef.value?.click()
}

// 파일 유효성 검사
const validateFile = (file: File): string | null => {
  // 파일 크기 검사
  const maxSizeBytes = props.maxSize * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return `파일 크기가 ${props.maxSize}MB를 초과합니다.`
  }

  // 파일 개수 검사
  if (files.value.length >= props.maxFiles) {
    return `최대 ${props.maxFiles}개의 파일만 업로드할 수 있습니다.`
  }

  return null
}

// 파일 업로드 처리
const handleFileUpload = async (fileList: FileList | File[]) => {
  const filesToUpload = Array.from(fileList)

  if (filesToUpload.length === 0) return

  // 유효성 검사
  for (const file of filesToUpload) {
    const error = validateFile(file)
    if (error) {
      ElMessage.warning(error)
      return
    }
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    if (props.multiple && filesToUpload.length > 1) {
      // 다중 파일 업로드
      const response = await uploadMultipleAtchFiles(props.siteCode, filesToUpload, {
        type: props.fileType,
      })
      const uploadedFiles = response.data.data
      files.value = [...files.value, ...uploadedFiles]
      uploadedFiles.forEach((f) => emit('upload', f))
      ElMessage.success(`${uploadedFiles.length}개 파일이 업로드되었습니다.`)
    } else {
      // 단일 파일 업로드
      for (const file of filesToUpload) {
        const response = await uploadAtchFile(props.siteCode, file, {
          type: props.fileType,
        })
        const uploadedFile = response.data.data
        files.value = [...files.value, uploadedFile]
        emit('upload', uploadedFile)
      }
      ElMessage.success('파일이 업로드되었습니다.')
    }
  } catch (error) {
    ElMessage.error('파일 업로드에 실패했습니다.')
    console.error('Upload error:', error)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
    // 파일 입력 초기화
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 파일 선택 이벤트
const onFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFileUpload(target.files)
  }
}

// 드래그 앤 드롭 이벤트
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files) {
    handleFileUpload(event.dataTransfer.files)
  }
}

// 파일 삭제
const handleDelete = async (file: AtchFileDto, index: number) => {
  try {
    await deleteAtchFile(file.id)
    const newFiles = [...files.value]
    newFiles.splice(index, 1)
    files.value = newFiles
    emit('delete', file)
    ElMessage.success('파일이 삭제되었습니다.')
  } catch (error) {
    ElMessage.error('파일 삭제에 실패했습니다.')
    console.error('Delete error:', error)
  }
}

// 파일 다운로드
const handleDownload = async (file: AtchFileDto) => {
  try {
    await downloadAtchFile(file.id, file.originalName)
  } catch (error) {
    ElMessage.error('파일 다운로드에 실패했습니다.')
    console.error('Download error:', error)
  }
}
</script>

<template>
  <div class="file-uploader">
    <!-- 업로드 영역 -->
    <div
      class="upload-area"
      :class="{ dragging: isDragging, uploading: isUploading }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="openFileDialog"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="file-input"
        @click.stop
        @change="onFileSelect"
      />

      <div v-if="isUploading" class="upload-progress">
        <i class="mdi mdi-loading mdi-spin"></i>
        <span>업로드 중...</span>
      </div>

      <div v-else class="upload-content">
        <div class="upload-icon">
          <i class="mdi mdi-cloud-upload-outline"></i>
        </div>
        <div class="upload-text">
          <p class="main-text">파일을 드래그하거나 클릭하여 업로드</p>
          <p class="sub-text">
            최대 {{ maxSize }}MB, {{ maxFiles }}개 파일까지 업로드 가능
          </p>
        </div>
      </div>
    </div>

    <!-- 파일 목록 -->
    <div v-if="files.length > 0" class="file-list">
      <div v-for="(file, index) in files" :key="file.id" class="file-item">
        <!-- 이미지 미리보기 -->
        <div v-if="showPreview && isImage(file)" class="file-preview">
          <img :src="getFileUrl(file.url)" :alt="file.originalName" />
        </div>

        <!-- 파일 아이콘 -->
        <div v-else class="file-icon">
          <i class="mdi" :class="getFileIcon(file)"></i>
        </div>

        <!-- 파일 정보 -->
        <div class="file-info">
          <span class="file-name" :title="file.originalName">{{ file.originalName }}</span>
          <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
        </div>

        <!-- 액션 버튼 -->
        <div class="file-actions">
          <button class="action-btn download" title="다운로드" @click.stop="handleDownload(file)">
            <i class="mdi mdi-download-outline"></i>
          </button>
          <button class="action-btn delete" title="삭제" @click.stop="handleDelete(file, index)">
            <i class="mdi mdi-trash-can-outline"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-uploader {
  width: 100%;
}

/* 업로드 영역 */
.upload-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 32px;
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.02);
}

.upload-area.dragging {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
  border-style: solid;
}

.upload-area.uploading {
  cursor: wait;
  pointer-events: none;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.upload-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 16px;
  margin-bottom: 16px;
}

.upload-icon .mdi {
  font-size: 32px;
  color: #6366f1;
}

.upload-text .main-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.upload-text .sub-text {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-progress .mdi {
  font-size: 40px;
  color: #6366f1;
}

.upload-progress span {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 파일 목록 */
.file-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.02);
}

/* 파일 미리보기 */
.file-preview {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 파일 아이콘 */
.file-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.file-icon .mdi {
  font-size: 24px;
  color: var(--text-secondary);
}

/* 파일 정보 */
.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 액션 버튼 */
.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn .mdi {
  font-size: 18px;
}

.action-btn.download {
  color: #6366f1;
}

.action-btn.download:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.action-btn.delete {
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

/* 반응형 */
@media (max-width: 640px) {
  .upload-area {
    min-height: 120px;
    padding: 24px;
  }

  .upload-icon {
    width: 48px;
    height: 48px;
  }

  .upload-icon .mdi {
    font-size: 24px;
  }

  .file-preview,
  .file-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
