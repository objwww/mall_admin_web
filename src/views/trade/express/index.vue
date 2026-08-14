<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft } from '@element-plus/icons-vue'
import { getExpressCompanyListAPI, createExpressCompanyAPI, updateExpressCompanyAPI, deleteExpressCompanyAPI } from '@/apis/trade'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, name: '', status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getExpressCompanyListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, name: '', code: '', sort: 0, status: 1 })
const rules = { name: [{ required: true, message: '请输入快递公司名称', trigger: 'blur' }] }

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, name: row.name, code: row.code, sort: row.sort, status: row.status }
    : { id: null, name: '', code: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { name: form.name, code: form.code, sort: form.sort, status: form.status }
  if (form.id) {
    await updateExpressCompanyAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createExpressCompanyAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该快递公司？', '提示', { type: 'warning' })
  await deleteExpressCompanyAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">快递公司</span>
        <div class="header-actions">
          <el-input v-model="listQuery.name" placeholder="公司名称" clearable style="width: 180px" @keyup.enter="getList" />
          <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.name = ''; listQuery.status = null; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">快递公司列表</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增快递公司</el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="公司名称" prop="name" min-width="180" align="center" />
        <el-table-column label="公司编码" prop="code" min-width="120" align="center" />
        <el-table-column label="排序" prop="sort" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑快递公司' : '新增快递公司'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="form.name" placeholder="如 顺丰速运" />
        </el-form-item>
        <el-form-item label="公司编码">
          <el-input v-model="form.code" placeholder="如 SF" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
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
</style>
