<script setup lang="ts">
import { formatDateTime } from '@/utils/datetime'
import type { ReturnAddressInfo } from '@/types/afterSale'

defineProps<{
  address: ReturnAddressInfo
  deadline?: string
}>()

const formatAddress = (addr: ReturnAddressInfo) => {
  if (!addr) return '-'
  return `${addr.province || ''}${addr.city || ''}${addr.region || ''}${addr.detailAddress || ''}`
}
</script>

<template>
  <el-card v-if="address" shadow="never">
    <span class="font-title-medium">退货地址</span>
    <div class="address-card">
      <div class="address-row">
        <span class="address-name">{{ address.name }}</span>
        <span class="address-phone">{{ address.phone }}</span>
      </div>
      <div class="address-detail">{{ formatAddress(address) }}</div>
      <div v-if="deadline" class="deadline-tip">
        请在 {{ formatDateTime(deadline) }} 前寄出
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.font-title-medium {
  font-size: 16px;
  font-weight: bold;
}
.address-card {
  margin-top: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}
.address-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}
.address-name {
  font-size: 16px;
  font-weight: bold;
}
.address-phone {
  font-size: 14px;
  color: #666;
}
.address-detail {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
.deadline-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #f56c6c;
}
</style>
