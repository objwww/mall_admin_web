<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAfterSaleDetailAPI, getCompanyAddressListAPI } from '@/apis/afterSale'
import type { AfterSaleDetail, AfterSaleStatus, RefundStatus, OmsCompanyAddress } from '@/types/afterSale'
import { AfterSaleStatusText, RefundStatusText } from '@/types/afterSale'
import { hasPermission } from '@/utils/permission'

// 引入独立组件
import AfterSaleGoodsInfo from './components/AfterSaleGoodsInfo.vue'
import AfterSaleBaseInfo from './components/AfterSaleBaseInfo.vue'
import AfterSaleProofPics from './components/AfterSaleProofPics.vue'
import AfterSaleReturnAddress from './components/AfterSaleReturnAddress.vue'
import AfterSaleBuyerShipment from './components/AfterSaleBuyerShipment.vue'
import AfterSaleInspectionInfo from './components/AfterSaleInspectionInfo.vue'
import AfterSaleRefundInfo from './components/AfterSaleRefundInfo.vue'
import AfterSaleTimeline from './components/AfterSaleTimeline.vue'
import AfterSaleActionDialogs from './components/AfterSaleActionDialogs.vue'

const route = useRoute()

const id = ref<number>(0)
const detail = ref<AfterSaleDetail>({} as AfterSaleDetail)
const loading = ref(false)
const companyAddressList = ref<OmsCompanyAddress[]>([])

// 操作对话框组件引用
const actionDialogsRef = ref()

const getDetail = async () => {
  loading.value = true
  try {
    const res = await getAfterSaleDetailAPI(id.value)
    detail.value = res.data
  } catch (e: any) {
    console.error('加载售后详情失败', e)
  } finally {
    loading.value = false
  }
}

const getCompanyAddressList = async () => {
  try {
    const res = await getCompanyAddressListAPI()
    companyAddressList.value = res.data || []
  } catch (e) {
    console.error('加载公司地址失败', e)
  }
}

onMounted(() => {
  id.value = Number(route.query.id)
  if (id.value) {
    getDetail()
    getCompanyAddressList()
  }
})

// 计算属性
const statusText = computed(() => AfterSaleStatusText[detail.value.status as AfterSaleStatus] || '未知')
const refundStatusText = computed(() => {
  if (!detail.value.refund) return '-'
  return RefundStatusText[detail.value.refund.status as RefundStatus] || '未知'
})
const allowedActions = computed(() => detail.value.allowedActions || [])
const canApprove = computed(() => hasPermission('oms:afterSale:audit') && allowedActions.value.includes('ADMIN_APPROVE'))
const canReject = computed(() => hasPermission('oms:afterSale:audit') && allowedActions.value.includes('ADMIN_REJECT'))
const canReceive = computed(() => hasPermission('oms:afterSale:receive') && allowedActions.value.includes('ADMIN_RECEIVE'))
// 换货发出：售后类型为换货(3)且状态为等待商家发货(50)
const canShipExchange = computed(() => hasPermission('oms:afterSale:ship') && allowedActions.value.includes('ADMIN_SHIP_EXCHANGE'))

// 操作成功后刷新
const handleActionSuccess = () => {
  getDetail()
}
</script>

<template>
  <div class="detail-container" v-loading="loading">
    <!-- 状态头部 -->
    <el-card shadow="never" class="status-card">
      <div class="status-header">
        <div>
          <span class="status-label">售后状态：</span>
          <el-tag :type="detail.status === 70 ? 'success' : detail.status >= 80 ? 'info' : 'warning'" size="large">
            {{ statusText }}
          </el-tag>
          <span v-if="detail.refund" class="refund-label">
            退款状态：
            <el-tag :type="detail.refund.status === 2 ? 'success' : detail.refund.status === 3 ? 'danger' : 'warning'" size="small">
              {{ refundStatusText }}
            </el-tag>
          </span>
        </div>
        <div class="action-btns">
          <el-button v-if="canApprove" type="primary" @click="actionDialogsRef?.openApproveDialog()">审核通过</el-button>
          <el-button v-if="canReject" type="danger" @click="actionDialogsRef?.openRejectDialog()">审核拒绝</el-button>
          <el-button v-if="canReceive" type="success" @click="actionDialogsRef?.openReceiveDialog()">确认收货</el-button>
          <el-button v-if="canShipExchange" type="warning" @click="actionDialogsRef?.openShipExchangeDialog()">确认换货发出</el-button>
        </div>
      </div>
    </el-card>

    <!-- 商品信息 -->
    <AfterSaleGoodsInfo :detail="detail" class="section-card" />

    <!-- 售后基本信息 -->
    <AfterSaleBaseInfo :detail="detail" class="section-card" />

    <!-- 凭证图片 -->
    <AfterSaleProofPics :proof-pics="detail.proofPics" class="section-card" />

    <!-- 退货地址 -->
    <AfterSaleReturnAddress
      v-if="detail.returnAddress"
      :address="detail.returnAddress"
      :deadline="detail.returnShipDeadline"
      class="section-card"
    />

    <!-- 买家物流 -->
    <AfterSaleBuyerShipment v-if="detail.buyerShipment" :shipment="detail.buyerShipment" class="section-card" />

    <!-- 商家换货发出物流 -->
    <AfterSaleBuyerShipment
      v-if="detail.sellerShipment"
      title="换货发出物流"
      time-label="发出时间"
      :shipment="detail.sellerShipment"
      class="section-card"
    />

    <!-- 验货信息 -->
    <AfterSaleInspectionInfo v-if="detail.inspectionResult" :detail="detail" class="section-card" />

    <!-- 退款信息 -->
    <AfterSaleRefundInfo v-if="detail.refund" :refund="detail.refund" class="section-card" />

    <!-- 售后时间线 -->
    <AfterSaleTimeline :timeline="detail.timeline" class="section-card" />

    <!-- 操作对话框 -->
    <AfterSaleActionDialogs
      ref="actionDialogsRef"
      :detail="detail"
      :company-address-list="companyAddressList"
      @success="handleActionSuccess"
    />
  </div>
</template>

<style scoped>
.detail-container {
  padding: 20px;
}
.status-card {
  margin-bottom: 20px;
}
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-label {
  font-size: 16px;
  font-weight: bold;
}
.refund-label {
  margin-left: 20px;
  font-size: 14px;
}
.action-btns {
  display: flex;
  gap: 10px;
}
.section-card {
  margin-top: 20px;
}
</style>
