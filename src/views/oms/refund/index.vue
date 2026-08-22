<template>
  <div class="app-container">
    <el-form :model="listQuery" class="filter-container" inline>
      <el-form-item label="订单号">
        <el-input v-model="listQuery.orderSn" placeholder="请输入订单号" clearable style="width: 200px" @keyup.enter="getList" />
      </el-form-item>
      <el-form-item label="退款状态">
        <el-select v-model="listQuery.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="待退款" :value="0" />
          <el-option label="退款中" :value="1" />
          <el-option label="退款成功" :value="2" />
          <el-option label="退款失败" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="list" border style="width: 100%">
      <el-table-column label="退款单号" prop="refundSn" width="180" show-overflow-tooltip />
      <el-table-column label="订单号" prop="orderSn" width="160" show-overflow-tooltip />
      <el-table-column label="用户" prop="memberUsername" width="120" show-overflow-tooltip />
      <el-table-column label="退款金额" width="110" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ row.refundAmount?.toFixed(2) || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="退款渠道" width="100" align="center">
        <template #default="{ row }">{{ channelText(row.channelCode) }}</template>
      </el-table-column>
      <el-table-column label="退款状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="失败原因" prop="errorMsg" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.errorMsg" class="error-msg">{{ row.errorMsg }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="170" align="center">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="完成时间" prop="finishTime" width="170" align="center">
        <template #default="{ row }">{{ row.finishTime ? formatDateTime(row.finishTime) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 3" type="text" size="small" @click="handleRetry(row)">重新退款</el-button>
          <el-button v-if="row.status === 1" type="text" size="small" @click="handleReconcile(row)">查询渠道</el-button>
          <el-button type="text" size="small" @click="handleDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-show="total > 0" class="pagination" background :current-page="listQuery.pageNum" :page-size="listQuery.pageSize" :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />

    <el-dialog v-model="detailVisible" title="退款单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRefund">
        <el-descriptions-item label="退款单号">{{ currentRefund.refundSn }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentRefund.orderSn }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentRefund.memberUsername }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">¥{{ currentRefund.refundAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="退款渠道">{{ channelText(currentRefund.channelCode) }}</el-descriptions-item>
        <el-descriptions-item label="渠道退款号">{{ currentRefund.channelRefundNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款状态">
          <el-tag :type="statusTagType(currentRefund.status)" size="small">{{ statusText(currentRefund.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ currentRefund.retryCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2">{{ currentRefund.errorMsg || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentRefund.handleMan || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作备注">{{ currentRefund.handleNote || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentRefund.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentRefund.finishTime ? formatDateTime(currentRefund.finishTime) : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/datetime'
import { getRefundListAPI, getRefundDetailAPI, retryRefundAPI, reconcileRefundAPI } from '@/apis/refund'
import type { OmsOrderRefund, RefundQueryParam } from '@/types/refund'
import { refundStatusText, refundChannelText } from '@/types/refund'

const listQuery = ref<RefundQueryParam>({ pageNum: 1, pageSize: 10 })
const list = ref<OmsOrderRefund[]>([])
const total = ref(0)
const listLoading = ref(false)
const detailVisible = ref(false)
const currentRefund = ref<OmsOrderRefund | null>(null)

const getList = async () => {
  listLoading.value = true
  try {
    const res = await getRefundListAPI(listQuery.value)
    list.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
  } finally {
    listLoading.value = false
  }
}

const resetQuery = () => {
  listQuery.value = { pageNum: 1, pageSize: 10 }
  getList()
}

const handleSizeChange = (val: number) => {
  listQuery.value.pageSize = val
  listQuery.value.pageNum = 1
  getList()
}

const handlePageChange = (val: number) => {
  listQuery.value.pageNum = val
  getList()
}

const handleRetry = async (row: OmsOrderRefund) => {
  try {
    await ElMessageBox.confirm(`确认重新退款？退款单号：${row.refundSn}`, '提示', { type: 'warning' })
    await retryRefundAPI(row.id, 'admin')
    ElMessage.success('重试已受理')
    getList()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const handleReconcile = async (row: OmsOrderRefund) => {
  try {
    await reconcileRefundAPI(row.id)
    ElMessage.success('渠道状态查询已完成')
    getList()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleDetail = async (row: OmsOrderRefund) => {
  try {
    const res = await getRefundDetailAPI(row.id)
    currentRefund.value = res.data
    detailVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '获取详情失败')
  }
}

const statusText = (status: number): string => refundStatusText[status] || '未知'
const statusTagType = (status: number): string => {
  if (status === 2) return 'success'
  if (status === 3) return 'danger'
  if (status === 1) return 'warning'
  return 'info'
}
const channelText = (code?: string): string => {
  if (!code) return '未知'
  return refundChannelText[code] || code
}

onMounted(() => { getList() })
</script>

<style scoped>
.filter-container { margin-bottom: 20px; }
.amount { color: #f56c6c; font-weight: 600; }
.error-msg { color: #f56c6c; font-size: 12px; }
.text-muted { color: #909399; }
.pagination { margin-top: 20px; text-align: right; }
</style>
