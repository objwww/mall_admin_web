<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDateTime } from '@/utils/datetime'
import type { AfterSaleDetail, AfterSaleStatus, AfterSaleType } from '@/types/afterSale'
import { AfterSaleStatusText, AfterSaleTypeText } from '@/types/afterSale'

const props = defineProps<{
  detail: AfterSaleDetail
}>()

const router = useRouter()

const statusText = computed(() => AfterSaleStatusText[props.detail.status as AfterSaleStatus] || '未知')
const typeText = computed(() => AfterSaleTypeText[props.detail.serviceType as AfterSaleType] || '未知')

const handleViewOrder = () => {
  router.push({ path: '/oms/orderDetail', query: { id: props.detail.orderId } })
}
</script>

<template>
  <el-card shadow="never">
    <span class="font-title-medium">售后信息</span>
    <div class="form-container-border">
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">售后单号</el-col>
        <el-col class="form-border font-small" :span="6">{{ detail.afterSaleSn }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">售后类型</el-col>
        <el-col class="form-border font-small" :span="6">{{ typeText }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">订单编号</el-col>
        <el-col class="form-border font-small" :span="6">
          {{ detail.orderSn }}
          <el-button type="text" size="small" @click="handleViewOrder">查看</el-button>
        </el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">用户账号</el-col>
        <el-col class="form-border font-small" :span="6">{{ detail.memberUsername || '-' }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">申请时间</el-col>
        <el-col class="form-border font-small" :span="6">{{ formatDateTime(detail.createTime) }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">售后截止时间</el-col>
        <el-col class="form-border font-small" :span="6">{{ formatDateTime(detail.afterSaleDeadline) }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">售后原因</el-col>
        <el-col class="form-border font-small" :span="6">{{ detail.reason }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">确认退款金额</el-col>
        <el-col class="form-border font-small" :span="6">
          <span class="color-danger">￥{{ detail.returnAmount || detail.applyAmount }}</span>
        </el-col>
      </el-row>
      <el-row v-if="detail.description">
        <el-col :span="6" class="form-border form-left-bg font-small">问题描述</el-col>
        <el-col class="form-border font-small" :span="18">{{ detail.description }}</el-col>
      </el-row>
    </div>
  </el-card>
</template>

<style scoped>
.font-title-medium {
  font-size: 16px;
  font-weight: bold;
}
.font-small {
  font-size: 14px;
}
.color-danger {
  color: #f56c6c;
}
.form-container-border {
  margin-top: 15px;
}
.form-border {
  border: 1px solid #ebeef5;
  padding: 10px;
  min-height: 40px;
  line-height: 20px;
}
.form-left-bg {
  background: #f5f7fa;
  font-weight: bold;
}
</style>
