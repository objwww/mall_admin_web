<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getPayNotifyTaskListAPI, getPayNotifyLogsAPI } from '@/apis/statistics'
import { formatDateTime } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getPayNotifyTaskListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const statusLabel = (s: number) => ({ 0: '等待通知', 10: '通知成功', 20: '通知失败', 21: '请求成功结果失败', 22: '请求失败' }[s] || '未知')
const statusType = (s: number): 'warning' | 'success' | 'danger' | 'info' =>
  ({ 0: 'warning', 10: 'success', 20: 'danger', 21: 'danger', 22: 'danger' } as Record<number, 'warning' | 'success' | 'danger'>)[s] || 'info'
const typeLabel = (t: number) => (t === 1 ? '支付订单' : t === 2 ? '退款订单' : '类型' + t)

/* 通知日志 */
const logVisible = ref(false)
const logList = ref<Record<string, any>[]>([])
const logLoading = ref(false)

const openLogs = async (row: Record<string, any>) => {
  logVisible.value = true
  logLoading.value = true
  try {
    const res = await getPayNotifyLogsAPI(row.id)
    logList.value = res.data || []
  } finally {
    logLoading.value = false
  }
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">支付回调任务</span>
        <div class="header-actions">
          <el-select v-model="listQuery.status" placeholder="通知状态" clearable style="width: 160px">
            <el-option label="等待通知" :value="0" />
            <el-option label="通知成功" :value="10" />
            <el-option label="通知失败" :value="20" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.status = null; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">回调任务列表（失败自动按频率重试）</span>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" type="primary" effect="plain">{{ typeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数据ID" prop="data_id" width="80" align="center" />
        <el-table-column label="商户订单号" prop="merchant_order_id" min-width="170" align="center" />
        <el-table-column label="状态" width="150" align="center">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通知次数" width="100" align="center">
          <template #default="scope">{{ scope.row.notify_times }} / {{ scope.row.max_notify_times }}</template>
        </el-table-column>
        <el-table-column label="下次通知时间" width="170" align="center">
          <template #default="scope">{{ scope.row.next_notify_time ? formatDateTime(scope.row.next_notify_time) : '-' }}</template>
        </el-table-column>
        <el-table-column label="通知地址" prop="notify_url" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="openLogs(scope.row)">通知日志</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>

    <el-dialog v-model="logVisible" title="通知日志" width="760px" destroy-on-close>
      <el-table :data="logList" v-loading="logLoading" border size="small">
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="任务ID" prop="task_id" width="80" align="center" />
        <el-table-column label="通知次数" prop="notify_times" width="90" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.status === 10 ? 'success' : 'danger'">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="响应内容" prop="response" min-width="200" show-overflow-tooltip />
        <el-table-column label="时间" width="170" align="center">
          <template #default="scope">{{ formatDateTime(scope.row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="logVisible = false">关闭</el-button>
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
