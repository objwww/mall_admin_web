<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, RefreshLeft, CircleCheck } from '@element-plus/icons-vue'
import { getPickupCodeListAPI, generatePickupCodeAPI, verifyPickupCodeAPI, getPickupPointOptionsAPI } from '@/apis/trade'
import { formatTs } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, orderSn: '', status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)
const pointOptions = ref<Record<string, any>[]>([])

const getList = async () => {
  loading.value = true
  try {
    const res = await getPickupCodeListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  const res = await getPickupPointOptionsAPI()
  pointOptions.value = res.data || []
}

/* 生成核销码 */
const generateVisible = ref(false)
const generateForm = reactive({ orderSn: '', pickupPointId: null as number | null })

const submitGenerate = async () => {
  if (!generateForm.orderSn) {
    ElMessage.warning('请输入订单号')
    return
  }
  const res = await generatePickupCodeAPI({ ...generateForm })
  ElMessage.success('生成成功：' + res.data.code)
  generateVisible.value = false
  getList()
}

/* 核销 */
const verifyVisible = ref(false)
const verifyCode = ref('')

const submitVerify = async () => {
  if (!verifyCode.value) {
    ElMessage.warning('请输入核销码')
    return
  }
  const res = await verifyPickupCodeAPI(verifyCode.value)
  ElMessage.success('核销成功：订单 ' + res.data.orderSn)
  verifyVisible.value = false
  verifyCode.value = ''
  getList()
}

const handleDelete = async (row: Record<string, any>) => {
  await ElMessageBox.confirm('该操作不提供删除接口，建议核销后归档。是否刷新列表？', '提示', { type: 'info' })
  getList()
}

const pointName = (id: number | null) => {
  const found = pointOptions.value.find(p => Number(p.id) === Number(id))
  return found ? found.name : '-'
}

onMounted(() => {
  getList()
  loadOptions()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">自提核销码</span>
        <div class="header-actions">
          <el-input v-model="listQuery.orderSn" placeholder="订单号" clearable style="width: 200px" @keyup.enter="getList" />
          <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="未核销" :value="0" />
            <el-option label="已核销" :value="1" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.orderSn = ''; listQuery.status = null; getList() }">重置</el-button>
          <el-button type="success" :icon="CircleCheck" @click="verifyVisible = true">核销</el-button>
          <el-button type="primary" :icon="Plus" @click="generateVisible = true">生成核销码</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">核销码列表</span>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="订单号" prop="order_sn" min-width="170" align="center" />
        <el-table-column label="核销码" prop="code" min-width="160" align="center">
          <template #default="scope">
            <el-text class="code-text" copyable>{{ scope.row.code }}</el-text>
          </template>
        </el-table-column>
        <el-table-column label="自提点" width="150" align="center">
          <template #default="scope">{{ pointName(scope.row.pickup_point_id) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">{{ scope.row.status === 1 ? '已核销' : '未核销' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核销时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.verify_time) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="scope">{{ formatTs(scope.row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="generateVisible" title="生成自提核销码" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="订单号" required>
          <el-input v-model="generateForm.orderSn" placeholder="输入订单号" />
        </el-form-item>
        <el-form-item label="自提点">
          <el-select v-model="generateForm.pickupPointId" clearable placeholder="选择自提点" style="width: 100%">
            <el-option v-for="p in pointOptions" :key="p.id" :label="p.name" :value="Number(p.id)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyVisible" title="核销自提码" width="440px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="核销码" required>
          <el-input v-model="verifyCode" placeholder="输入核销码" @keyup.enter="submitVerify" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button type="success" @click="submitVerify">核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter-container { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.card-title { font-weight: 600; font-size: 15px; color: #303133; }
.header-actions { display: flex; gap: 10px; }
.table-card { margin-bottom: 16px; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.toolbar-title { font-weight: 600; color: #303133; }
.pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
.code-text { font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 1px; }
</style>
