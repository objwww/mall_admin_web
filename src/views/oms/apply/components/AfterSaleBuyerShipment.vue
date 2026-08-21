<script setup lang="ts">
import { formatDateTime } from '@/utils/datetime'
import type { BuyerShipmentInfo } from '@/types/afterSale'

defineProps<{
  shipment: BuyerShipmentInfo
}>()
</script>

<template>
  <el-card v-if="shipment" shadow="never">
    <span class="font-title-medium">买家退货物流</span>
    <div class="form-container-border">
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">快递公司</el-col>
        <el-col class="form-border font-small" :span="6">{{ shipment.deliveryCompany }}</el-col>
        <el-col :span="6" class="form-border form-left-bg font-small">快递单号</el-col>
        <el-col class="form-border font-small" :span="6">{{ shipment.deliverySn }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="6" class="form-border form-left-bg font-small">寄出时间</el-col>
        <el-col class="form-border font-small" :span="18">{{ formatDateTime(shipment.deliveryTime) }}</el-col>
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
