<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/utils/datetime'
import type { RefundInfo, RefundStatus } from '@/types/afterSale'
import { RefundStatusText } from '@/types/afterSale'

const props = defineProps<{
  refund: RefundInfo
}>()

const refundStatusText = computed(() => {
  if (!props.refund) return '-'
  return RefundStatusText[props.refund.status as RefundStatus] || '未知'
})
</script>

<template>
  <el-card v-if="refund" shadow="never">
    <span class="font-title-medium">退款信息</span>
    <div class="form-container-border">
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">退款单号</el-col>
        <el-col class="form-border font-small" :span="6">{{ refund.refundSn }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">退款金额</el-col>
        <el-col class="form-border font-small" :span="6">
          <span class="color-danger">￥{{ refund.refundAmount }}</span>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">退款渠道</el-col>
        <el-col class="form-border font-small" :span="6">{{ refund.channelCode }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">退款状态</el-col>
        <el-col class="form-border font-small" :span="6">{{ refundStatusText }}</el-col>
      </el-row>
      <el-row v-if="refund.errorMsg">
        <el-col :span="6" class="form-border form-left-bg font-small">失败原因</el-col>
        <el-col class="form-border font-small color-danger" :span="18">{{ refund.errorMsg }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">创建时间</el-col>
        <el-col class="form-border font-small" :span="6">{{ formatDateTime(refund.createTime) }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">完成时间</el-col>
        <el-col class="form-border font-small" :span="6">{{ refund.finishTime ? formatDateTime(refund.finishTime) : '-' }}</el-col>
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
