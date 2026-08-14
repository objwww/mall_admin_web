<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft } from '@element-plus/icons-vue'
import { getFullReductionListAPI, createFullReductionAPI, updateFullReductionAPI, deleteFullReductionAPI } from '@/apis/marketing'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, name: '', status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getFullReductionListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, name: '', startTime: null as number | null, endTime: null as number | null, fullAmount: 0, reduceAmount: 0, freeShipping: 0, status: 0 })
const rules = { name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }] }

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, name: row.name, startTime: row.start_time, endTime: row.end_time, fullAmount: row.full_amount, reduceAmount: row.reduce_amount, freeShipping: row.free_shipping, status: row.status }
    : { id: null, name: '', startTime: null, endTime: null, fullAmount: 0, reduceAmount: 0, freeShipping: 0, status: 0 })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { name: form.name, startTime: form.startTime, endTime: form.endTime, fullAmount: form.fullAmount, reduceAmount: form.reduceAmount, freeShipping: form.freeShipping, status: form.status }
  if (form.id) {
    await updateFullReductionAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createFullReductionAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否删除该活动？', '提示', { type: 'warning' })
  await deleteFullReductionAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

const statusLabel = (s: number) => ({ 0: '未开始', 1: '进行中', 2: '已结束' }[s] || '未开始')
const statusType = (s: number) => ({ 0: 'info', 1: 'success', 2: 'warning' }[s] || 'info')

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">满减送</span>
        <div class="header-actions">
          <el-input v-model="listQuery.name" placeholder="活动名称" clearable style="width: 180px" @keyup.enter="getList" />
          <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.name = ''; listQuery.status = null; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">活动列表</span>
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增活动</el-button>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="活动名称" prop="name" min-width="180" align="center" />
        <el-table-column label="满减规则" min-width="160" align="center">
          <template #default="scope">满￥{{ scope.row.full_amount }} 减￥{{ scope.row.reduce_amount }}</template>
        </el-table-column>
        <el-table-column label="包邮" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.free_shipping === 1 ? 'success' : 'info'">{{ scope.row.free_shipping === 1 ? '包邮' : '不包' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.start_time) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.end_time) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="活动名称" />
        </el-form-item>
        <el-form-item label="满X元" required>
          <el-input-number v-model="form.fullAmount" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="减Y元" required>
          <el-input-number v-model="form.reduceAmount" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="是否包邮">
          <el-radio-group v-model="form.freeShipping">
            <el-radio :value="0">不包邮</el-radio>
            <el-radio :value="1">包邮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="开始时间" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="结束时间" value-format="x" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">未开始</el-radio>
            <el-radio :value="1">进行中</el-radio>
            <el-radio :value="2">已结束</el-radio>
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
