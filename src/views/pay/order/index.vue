<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import { getPayOrderListAPI } from '@/apis/statistics'
import { formatDateTime } from '@/utils/datetime'

const listQuery = reactive({ pageNum: 1, pageSize: 10, merchantOrderId: '', status: null as number | null })
const list = ref<Record<string, any>[]>([])
const total = ref(0)
const loading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getPayOrderListAPI({ ...listQuery })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const statusLabel = (s: number) => ({ 0: '未支付', 10: '支付成功', 20: '已退款', 30: '已关闭' }[s] || '未知')
const statusType = (s: number): 'warning' | 'success' | 'info' =>
  ({ 0: 'warning', 10: 'success', 20: 'info', 30: 'info' } as Record<number, 'warning' | 'success' | 'info'>)[s] || 'info'
const channelLabel = (c: string) => (c === 'alipay' ? '支付宝' : c === 'wechat' ? '微信支付' : c)

onMounted(() => getList())
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">支付单</span>
        <div class="header-actions">
          <el-input v-model="listQuery.merchantOrderId" placeholder="商户订单号" clearable style="width: 200px" @keyup.enter="getList" />
          <el-select v-model="listQuery.status" placeholder="状态" clearable style="width: 130px">
            <el-option label="未支付" :value="0" />
            <el-option label="支付成功" :value="10" />
            <el-option label="已退款" :value="20" />
            <el-option label="已关闭" :value="30" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="getList">查询</el-button>
          <el-button :icon="RefreshLeft" @click="() => { listQuery.merchantOrderId = ''; listQuery.status = null; getList() }">重置</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <span class="toolbar-title">支付单列表</span>
      </div>
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="编号" prop="id" width="70" align="center" />
        <el-table-column label="商户订单号" prop="merchant_order_id" min-width="170" align="center" />
        <el-table-column label="订单标题" prop="subject" min-width="150" show-overflow-tooltip />
        <el-table-column label="渠道" width="100" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.channel_code === 'alipay' ? 'warning' : 'success'">{{ channelLabel(scope.row.channel_code) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" width="110" align="center">
          <template #default="scope">
            <span class="color-danger">￥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="渠道交易号" prop="channel_order_no" min-width="150" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="member_id" width="90" align="center" />
        <el-table-column label="支付成功时间" width="170" align="center">
          <template #default="scope">{{ scope.row.success_time ? formatDateTime(scope.row.success_time) : '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="scope">{{ formatDateTime(scope.row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination class="pagination-container" background layout="total, sizes, prev, pager, next, jumper"
        :total="total" v-model:current-page="listQuery.pageNum" v-model:page-size="listQuery.pageSize"
        :page-sizes="[10, 20, 50]" @current-change="getList" @size-change="() => { listQuery.pageNum = 1; getList() }" />
    </el-card>
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
