<script setup lang="ts">
import { formatDateTime } from '@/utils/datetime'
import type { AfterSaleTimelineItem } from '@/types/afterSale'

defineProps<{
  timeline: AfterSaleTimelineItem[]
}>()
</script>

<template>
  <el-card v-if="timeline && timeline.length > 0" shadow="never">
    <span class="font-title-medium">售后进度</span>
    <el-timeline class="timeline">
      <el-timeline-item
        v-for="(item, index) in timeline"
        :key="index"
        :timestamp="formatDateTime(item.createTime)"
        placement="top"
        :type="index === 0 ? 'primary' : undefined"
      >
        <div class="timeline-content">
          <span class="timeline-action">{{ item.actionText || item.action }}</span>
          <span v-if="item.operatorName" class="timeline-operator">（{{ item.operatorName }}）</span>
          <div v-if="item.note" class="timeline-note">{{ item.note }}</div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </el-card>
</template>

<style scoped>
.font-title-medium {
  font-size: 16px;
  font-weight: bold;
}
.timeline {
  margin-top: 20px;
}
.timeline-content {
  font-size: 14px;
}
.timeline-action {
  font-weight: bold;
}
.timeline-operator {
  color: #999;
  font-size: 12px;
}
.timeline-note {
  margin-top: 5px;
  color: #666;
  font-size: 13px;
}
</style>
