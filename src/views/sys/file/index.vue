<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, Upload } from '@element-plus/icons-vue'
import { getFileListAPI, uploadFileAPI, deleteFileAPI } from '@/apis/sys'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, fileName: '' })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getFileListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

/* 上传 */
const uploadVisible = ref(false)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const fileInput = ref()

const handleFileChange = (evt: Event) => {
  const input = evt.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files.item(0)
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    const res = await uploadFileAPI(formData)
    ElMessage.success('上传成功：' + (res.data.name || ''))
    uploadVisible.value = false
    selectedFile.value = null
    getList()
  } finally {
    uploading.value = false
  }
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('删除文件将同时删除 MinIO 对象与记录，是否继续？', '提示', { type: 'warning' })
  await deleteFileAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

const formatSize = (bytes: number) => {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">文件中心</span>
        <div class="header-actions">
          <el-input v-model="listQuery.fileName" placeholder="文件名" clearable style="width: 200px" @keyup.enter="getList" />
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.fileName = ''; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">文件列表（MinIO 统一存储）</span>
        <el-button type="primary" :icon="Plus" @click="uploadVisible = true">上传文件</el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="文件名" prop="file_name" min-width="200" show-overflow-tooltip />
        <el-table-column label="大小" width="100" align="center">
          <template #default="scope">{{ formatSize(scope.row.file_size) }}</template>
        </el-table-column>
        <el-table-column label="类型" prop="content_type" min-width="130" align="center" show-overflow-tooltip />
        <el-table-column label="存储" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.storage_type === 'minio' ? 'primary' : 'warning'">{{ scope.row.storage_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问地址" prop="file_url" min-width="240" show-overflow-tooltip>
          <template #default="scope">
            <el-link type="primary" :href="scope.row.file_url" target="_blank">{{ scope.row.file_url }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传文件" width="480px" destroy-on-close>
      <div class="upload-box" @click="fileInput.click()">
        <input ref="fileInput" type="file" style="display: none" @change="handleFileChange" />
        <el-icon :size="40" color="#909399"><Upload /></el-icon>
        <p>{{ selectedFile ? selectedFile.name : '点击选择文件（存储至 MinIO）' }}</p>
      </div>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter-container { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; color: #303133; }
.header-actions { display: flex; gap: 10px; }
.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.toolbar-title { font-weight: 600; color: #303133; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
.upload-box {
  height: 160px; border: 1px dashed #d9d9d9; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; color: #909399; transition: all .2s;
}
.upload-box:hover { border-color: #409eff; color: #409eff; }
</style>
