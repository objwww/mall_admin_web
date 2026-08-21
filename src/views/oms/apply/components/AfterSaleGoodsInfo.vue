<script setup lang="ts">
import type { AfterSaleDetail } from '@/types/afterSale'

defineProps<{
  detail: AfterSaleDetail
}>()
</script>

<template>
  <el-card shadow="never">
    <span class="font-title-medium">商品信息</span>
    <el-table border class="standard-margin" :data="[detail]">
      <el-table-column label="商品图片" width="120" align="center">
        <template #default="scope">
          <img style="height:80px" :src="scope.row.productPic" />
        </template>
      </el-table-column>
      <el-table-column label="商品名称" align="center">
        <template #default="scope">
          <span class="font-small">{{ scope.row.productName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格属性" width="200" align="center">
        <template #default="scope">{{ scope.row.productAttr || '-' }}</template>
      </el-table-column>
      <el-table-column label="数量" width="80" align="center">
        <template #default="scope">{{ scope.row.productCount || '-' }}</template>
      </el-table-column>
      <el-table-column label="申请金额" width="120" align="center">
        <template #default="scope">
          <span class="color-danger">￥{{ scope.row.applyAmount }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.standard-margin {
  margin-top: 15px;
}
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
</style>
