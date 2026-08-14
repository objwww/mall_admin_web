<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, View } from '@element-plus/icons-vue'
import { getDiyPageListAPI, createDiyPageAPI, updateDiyPageAPI, deleteDiyPageAPI, getDiyPageAPI } from '@/apis/marketing'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, name: '' })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getDiyPageListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, name: '', type: 'index', config: '', status: 1 })
const rules = { name: [{ required: true, message: '请输入页面名称', trigger: 'blur' }] }

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, name: row.name, type: row.type, config: row.config, status: row.status }
    : { id: null, name: '', type: 'index', config: '', status: 1 })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { name: form.name, type: form.type, config: form.config, status: form.status }
  if (form.id) {
    await updateDiyPageAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createDiyPageAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该装修页？', '提示', { type: 'warning' })
  await deleteDiyPageAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

/* 查看配置 */
const viewVisible = ref(false)
const viewConfig = ref('')

const handleView = async (row: Record<string, any>) => {
  const res = await getDiyPageAPI(row.id)
  try {
    viewConfig.value = JSON.stringify(JSON.parse(res.data.config), null, 2)
  } catch {
    viewConfig.value = res.data.config || ''
  }
  viewVisible.value = true
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">DIY 装修页</span>
        <div class="header-actions">
          <el-input v-model="listQuery.name" placeholder="页面名称" clearable style="width: 180px" @keyup.enter="getList" />
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.name = ''; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">装修页列表</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增页面</el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="页面名称" prop="name" min-width="180" align="center" />
        <el-table-column label="页面类型" width="110" align="center">
          <template #default="scope">
            <el-tag size="small" type="primary" effect="plain">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.update_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="success" link :icon="View" @click="handleView(scope.row)">查看配置</el-button>
            <el-button size="small" type="primary" link @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑装修页' : '新增装修页'" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="页面名称" prop="name">
          <el-input v-model="form.name" placeholder="如 首页装修" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-select v-model="form.type" style="width: 200px">
            <el-option label="首页 index" value="index" />
            <el-option label="商城 shop" value="shop" />
          </el-select>
        </el-form-item>
        <el-form-item label="页面配置">
          <el-input v-model="form.config" type="textarea" :rows="8" placeholder="JSON 配置（组件拖拽后的配置串）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" title="页面配置（JSON）" width="720px" destroy-on-close>
      <pre class="json-view">{{ viewConfig }}</pre>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
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
.json-view {
  max-height: 460px; overflow: auto; background: #f5f7fa; border-radius: 6px;
  padding: 12px; font-size: 12px; line-height: 1.6; color: #303133;
}
</style>
