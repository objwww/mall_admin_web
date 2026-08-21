<script setup lang="ts">
defineProps<{
  proofPics: string[]
}>()
</script>

<template>
  <el-card v-if="proofPics && proofPics.length > 0" shadow="never">
    <span class="font-title-medium">凭证图片</span>
    <div class="proof-list">
      <el-image
        v-for="(pic, index) in proofPics"
        :key="index"
        :src="pic"
        :preview-src-list="proofPics"
        :initial-index="index"
        fit="cover"
        class="proof-img"
      />
    </div>
  </el-card>
</template>

<style scoped>
.font-title-medium {
  font-size: 16px;
  font-weight: bold;
}
.proof-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}
.proof-img {
  width: 120px;
  height: 120px;
  border-radius: 4px;
}
</style>
