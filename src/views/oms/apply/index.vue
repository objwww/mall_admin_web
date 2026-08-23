<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :model="listQuery" class="filter-container" inline>
      <el-form-item label="售后单号">
        <el-input
          v-model="listQuery.afterSaleSn"
          placeholder="请输入售后单号"
          clearable
          style="width: 200px"
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item label="订单号">
        <el-input
          v-model="listQuery.orderSn"
          placeholder="请输入订单号"
          clearable
          style="width: 200px"
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item label="售后类型">
        <el-select v-model="listQuery.type" placeholder="全部" clearable style="width: 120px">
          <el-option label="仅退款" :value="1" />
          <el-option label="退货退款" :value="2" />
          <el-option label="换货" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="售后状态">
        <el-select v-model="listQuery.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="getList">搜索</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table v-loading="listLoading" :data="list" border style="width: 100%">
      <el-table-column label="售后单号" prop="afterSaleSn" width="160" show-overflow-tooltip />
      <el-table-column label="订单号" prop="orderSn" width="160" show-overflow-tooltip />
      <el-table-column label="用户" prop="memberUsername" width="120" show-overflow-tooltip />
      <el-table-column label="售后类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagType(row.serviceType)" size="small">{{ typeText(row.serviceType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="product-cell">
            <el-image v-if="row.productPic" :src="row.productPic" fit="cover" class="product-thumb" />
            <span class="product-name">{{ row.productName }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="数量" prop="productCount" width="80" align="center" />
      <el-table-column label="申请金额" width="110" align="right">
        <template #default="{ row }">
          <span v-if="row.serviceType === 3" class="exchange-amount">-</span>
          <span v-else class="amount">¥{{ row.applyAmount?.toFixed(2) || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="售后状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" prop="createTime" width="170" align="center">
        <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="handleDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-show="total > 0"
      class="pagination"
      background
      :current-page="listQuery.pageNum"
      :page-size="listQuery.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/datetime'
import { getAfterSaleListAPI } from '@/apis/afterSale'
import type { AfterSaleSummary, AfterSaleQueryParam } from '@/types/afterSale'

const router = useRouter()
type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined

// 状态选项（新售后状态码）
const statusOptions = [
  { label: '等待商家处理', value: 0 },
  { label: '等待买家寄回', value: 10 },
  { label: '买家已寄回', value: 20 },
  { label: '商家已收到', value: 30 },
  { label: '退款处理中', value: 40 },
  { label: '等待商家发换货', value: 50 },
  { label: '换货商品已发出', value: 60 },
  { label: '售后完成', value: 70 },
  { label: '已拒绝', value: 80 },
  { label: '用户已撤销', value: 90 },
  { label: '已超时关闭', value: 91 },
]

// 列表查询参数
const listQuery = ref<AfterSaleQueryParam>({
  pageNum: 1,
  pageSize: 10,
})

// 列表数据
const list = ref<AfterSaleSummary[]>([])
// 总数
const total = ref(0)
// 加载状态
const listLoading = ref(false)
// 获取列表
const getList = async () => {
  listLoading.value = true
  try {
    const res = await getAfterSaleListAPI(listQuery.value)
    list.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
    // 错误已由拦截器处理
  } finally {
    listLoading.value = false
  }
}

// 重置查询
const resetQuery = () => {
  listQuery.value = { pageNum: 1, pageSize: 10 }
  getList()
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  listQuery.value.pageSize = val
  listQuery.value.pageNum = 1
  getList()
}

// 页码变化
const handlePageChange = (val: number) => {
  listQuery.value.pageNum = val
  getList()
}

// 查看详情
const handleDetail = (row: AfterSaleSummary) => {
  router.push(`/oms/returnApplyDetail?id=${row.id}`)
}

// 售后类型文本
const typeText = (type: number): string => {
  const map: Record<number, string> = { 1: '仅退款', 2: '退货退款', 3: '换货' }
  return map[type] || '未知'
}

// 售后类型标签颜色
const typeTagType = (type: number): TagType => {
  const map: Record<number, TagType> = { 1: 'info', 2: 'warning', 3: 'success' }
  return map[type]
}

// 售后状态文本
const statusText = (status: number): string => {
  return statusOptions.find(item => item.value === status)?.label || '未知'
}

// 售后状态标签颜色
const statusTagType = (status: number): TagType => {
  if (status === 70) return 'success'
  if (status === 80) return 'danger'
  if (status === 90 || status === 91) return 'info'
  if (status >= 10 && status <= 60) return 'warning'
  return undefined
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-name {
  font-size: 13px;
  color: #303133;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.exchange-amount {
  color: #909399;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
