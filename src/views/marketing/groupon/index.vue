<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, Goods } from '@element-plus/icons-vue'
import {
  getGrouponListAPI, createGrouponAPI, updateGrouponAPI, deleteGrouponAPI,
  getGrouponProductListAPI, createGrouponProductAPI, deleteGrouponProductAPI,
} from '@/apis/marketing'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, name: '', status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getGrouponListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive<Record<string, any>>({ id: null, name: '', startTime: null as number | null, endTime: null as number | null, groupSize: 2, status: 0 })
const rules = { name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }] }

const openDialog = (row?: Record<string, any>) => {
  Object.assign(form, row
    ? { id: row.id, name: row.name, startTime: row.start_time, endTime: row.end_time, groupSize: row.group_size, status: row.status }
    : { id: null, name: '', startTime: null, endTime: null, groupSize: 2, status: 0 })
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value.validate()
  const params = { name: form.name, startTime: form.startTime, endTime: form.endTime, groupSize: form.groupSize, status: form.status }
  if (form.id) {
    await updateGrouponAPI({ id: form.id, ...params })
    ElMessage.success('修改成功')
  } else {
    await createGrouponAPI(params)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('删除活动将同时删除其活动商品，是否继续？', '提示', { type: 'warning' })
  await deleteGrouponAPI(row.id)
  ElMessage.success('删除成功')
  getList()
}

/* 活动商品 */
const productVisible = ref(false)
const currentActivity = ref<Record<string, any> | null>(null)
const productList = ref<Record<string, any>[]>([])
const productLoading = ref(false)

const openProducts = async (row: Record<string, any>) => {
  currentActivity.value = row
  productVisible.value = true
  productLoading.value = true
  try {
    const res = await getGrouponProductListAPI(row.id)
    productList.value = res.data || []
  } finally {
    productLoading.value = false
  }
}

const productForm = reactive<Record<string, any>>({ productId: null, productName: '', grouponPrice: 0, stock: 0, sort: 0 })
const productDialogVisible = ref(false)

const submitProduct = async () => {
  if (!productForm.productId) {
    ElMessage.warning('请输入商品ID')
    return
  }
  await createGrouponProductAPI({ activityId: currentActivity.value!.id, ...productForm })
  ElMessage.success('添加成功')
  productDialogVisible.value = false
  openProducts(currentActivity.value!)
}

const handleDeleteProduct = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('是否移除该活动商品？', '提示', { type: 'warning' })
  await deleteGrouponProductAPI(row.id)
  ElMessage.success('移除成功')
  openProducts(currentActivity.value!)
}

const statusLabel = (s: number) => ({ 0: '未开始', 1: '进行中', 2: '已结束' }[s] || '未开始')
const statusType = (s: number): 'info' | 'success' | 'warning' =>
  ({ 0: 'info', 1: 'success', 2: 'warning' } as Record<number, 'info' | 'success' | 'warning'>)[s] || 'info'

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">拼团</span>
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
        <el-table-column label="成团人数" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="warning" effect="plain">{{ scope.row.group_size }} 人团</el-tag>
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
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="success" link :icon="Goods" @click="openProducts(scope.row)">活动商品</el-button>
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
        <el-form-item label="成团人数">
          <el-input-number v-model="form.groupSize" :min="2" :max="100" />
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

    <el-dialog v-model="productVisible" :title="'活动商品：' + (currentActivity?.name || '')" width="720px" destroy-on-close>
      <div class="table-toolbar">
        <span class="toolbar-title">商品列表</span>
        <el-button type="primary" size="small" :icon="Plus" @click="productDialogVisible = true">添加商品</el-button>
      </div>
      <el-table :data="productList" v-loading="productLoading" border size="small">
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="商品ID" prop="product_id" width="90" align="center" />
        <el-table-column label="商品名称" prop="product_name" min-width="160" show-overflow-tooltip />
        <el-table-column label="拼团价" width="100" align="center">
          <template #default="scope">
            <span class="color-danger">￥{{ scope.row.groupon_price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" prop="stock" width="80" align="center" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" link @click="handleDeleteProduct(scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="productVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productDialogVisible" title="添加活动商品" width="520px" destroy-on-close>
      <el-form :model="productForm" label-width="90px">
        <el-form-item label="商品ID" required>
          <el-input-number v-model="productForm.productId" :min="1" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="productForm.productName" placeholder="商品名称" />
        </el-form-item>
        <el-form-item label="拼团价(元)">
          <el-input-number v-model="productForm.grouponPrice" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="拼团库存">
          <el-input-number v-model="productForm.stock" :min="0" style="width: 200px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="productForm.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">确定</el-button>
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
