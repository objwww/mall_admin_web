<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime } from '@/utils/datetime'
import type { AfterSaleDetail, InspectionResult } from '@/types/afterSale'
import { InspectionResultText } from '@/types/afterSale'

const props = defineProps<{
  detail: AfterSaleDetail
}>()

const inspectionResultText = computed(() => {
  if (!props.detail.inspectionResult) return '-'
  return InspectionResultText[props.detail.inspectionResult as InspectionResult] || '未知'
})

const restockStatusText = computed(() => {
  if (props.detail.restockStatus === 1) return '已恢复'
  if (props.detail.restockStatus === 2) return '不恢复'
  return '未处理'
})
</script>

<template>
  <el-card v-if="detail.inspectionResult" shadow="never">
    <span class="font-title-medium">验货信息</span>
    <div class="form-container-border">
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">验货结果</el-col>
        <el-col class="form-border font-small" :span="6">{{ inspectionResultText }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">库存恢复</el-col>
        <el-col class="form-border font-small" :span="6">{{ restockStatusText }}</el-col>
      </el-row>
      <el-row v-if="detail.receiveNote">
        <el-col :span="6" class="form-border form-left-bg font-small">收货备注</el-col>
        <el-col class="form-border font-small" :span="18">{{ detail.receiveNote }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">收货人</el-col>
        <el-col class="form-border font-small" :span="6">{{ detail.receiveMan || '-' }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">收货时间</el-col>
        <el-col class="form-border font-small" :span="6">{{ detail.receiveTime ? formatDateTime(detail.receiveTime) : '-' }}</el-col>
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
