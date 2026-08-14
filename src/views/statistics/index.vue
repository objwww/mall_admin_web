<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { getTradeStatisticsAPI, getProductStatisticsAPI, getMemberStatisticsAPI, getPaymentStatisticsAPI } from '@/apis/statistics'
import { formatDate } from '@/utils/datetime'

use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const dateRange = ref<[string, string] | null>(null)

/* ============ 交易统计 ============ */
const tradeData = ref<Record<string, any>>({})
const tradeLoading = ref(false)

const loadTrade = async () => {
  tradeLoading.value = true
  try {
    const params: Record<string, any> = {}
    if (dateRange.value) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getTradeStatisticsAPI(params)
    tradeData.value = res.data
  } finally {
    tradeLoading.value = false
  }
}

const tradeTrendOption = computed(() => {
  const trend = tradeData.value.trend || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', 'GMV'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trend.map((t: any) => t.day) },
    yAxis: [
      { type: 'value', name: '订单数' },
      { type: 'value', name: 'GMV(元)' },
    ],
    series: [
      {
        name: '订单数', type: 'line', smooth: true, areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#409EFF' }, data: trend.map((t: any) => t.order_count),
      },
      {
        name: 'GMV', type: 'line', yAxisIndex: 1, smooth: true, areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#67C23A' }, data: trend.map((t: any) => t.gmv),
      },
    ],
  }
})

/* ============ 商品统计 ============ */
const productList = ref<Record<string, any>[]>([])
const productLoading = ref(false)

const loadProduct = async () => {
  productLoading.value = true
  try {
    const params: Record<string, any> = {}
    if (dateRange.value) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getProductStatisticsAPI(params)
    productList.value = (res.data.list || []).slice(0, 10)
  } finally {
    productLoading.value = false
  }
}

const productOption = computed(() => {
  const names = productList.value.map(p => p.product_name)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', name: '销量' },
    yAxis: { type: 'category', data: names.reverse(), axisLabel: { width: 120, overflow: 'truncate' } },
    series: [
      {
        name: '销量', type: 'bar', barWidth: 16,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: '#409EFF' }, { offset: 1, color: '#79BBFF' }],
          },
          borderRadius: [0, 8, 8, 0],
        },
        data: productList.map(p => p.sales_count).reverse(),
      },
    ],
  }
})

/* ============ 会员统计 ============ */
const memberData = ref<Record<string, any>>({})
const memberLoading = ref(false)

const loadMember = async () => {
  memberLoading.value = true
  try {
    const params: Record<string, any> = {}
    if (dateRange.value) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getMemberStatisticsAPI(params)
    memberData.value = res.data
  } finally {
    memberLoading.value = false
  }
}

const memberRecentOption = computed(() => {
  const recent = memberData.value.recent7day || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: recent.map((r: any) => r.day) },
    yAxis: { type: 'value', name: '新增' },
    series: [
      {
        name: '近7日新增', type: 'bar', barWidth: 20,
        itemStyle: { color: '#67C23A', borderRadius: [6, 6, 0, 0] },
        data: recent.map((r: any) => r.cnt),
      },
    ],
  }
})

/* ============ 支付统计 ============ */
const paymentList = ref<Record<string, any>[]>([])
const paymentLoading = ref(false)
const activeTab = ref('trade')

const loadPayment = async () => {
  paymentLoading.value = true
  try {
    const params: Record<string, any> = {}
    if (dateRange.value) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getPaymentStatisticsAPI(params)
    paymentList.value = res.data.list || []
  } finally {
    paymentLoading.value = false
  }
}

const paymentOption = computed(() => {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 单 ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        name: '支付渠道', type: 'pie', radius: ['40%', '68%'], center: ['50%', '45%'],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { formatter: '{b}: {c}单' },
        data: paymentList.value.map((p: any) => ({
          name: p.pay_type === 1 ? '支付宝' : p.pay_type === 2 ? '微信支付' : '渠道' + p.pay_type,
          value: p.order_count,
        })),
      },
    ],
  }
})

const payTypeLabel = (t: number) => (t === 1 ? '支付宝' : t === 2 ? '微信支付' : '渠道' + t)

const refreshAll = () => {
  loadTrade()
  loadProduct()
  loadMember()
  loadPayment()
}

onMounted(() => {
  loadTrade()
  loadProduct()
  loadMember()
  loadPayment()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="filter-container">
      <div class="card-header">
        <span class="card-title">统计报表</span>
        <div class="header-actions">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" value-format="YYYY-MM-DD" :clearable="true" style="width: 280px" />
          <el-button type="primary" @click="refreshAll">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab">
        <!-- 交易 -->
        <el-tab-pane label="交易统计" name="trade">
          <el-row :gutter="16" class="stat-row">
            <el-col :span="6">
              <div class="stat-card stat-gmv">
                <div class="stat-label">GMV（元）</div>
                <div class="stat-value">￥{{ Number(tradeData.gmv || 0).toLocaleString() }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card stat-order">
                <div class="stat-label">订单数</div>
                <div class="stat-value">{{ tradeData.order_count ?? 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card stat-refund">
                <div class="stat-label">退款金额（元）</div>
                <div class="stat-value">￥{{ Number(tradeData.refund_amount || 0).toLocaleString() }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card stat-avg">
                <div class="stat-label">客单价（元）</div>
                <div class="stat-value">￥{{ Number(tradeData.avg_amount || 0).toFixed(2) }}</div>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="16">
              <div class="chart-box">
                <div class="chart-title">交易趋势（按支付时间）</div>
                <v-chart v-loading="tradeLoading" :option="tradeTrendOption" autoresize style="height: 320px" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="chart-box">
                <div class="chart-title">退款概况</div>
                <el-descriptions :column="1" border size="small" style="margin-top: 12px">
                  <el-descriptions-item label="退款单数">{{ tradeData.refund_count ?? 0 }} 单</el-descriptions-item>
                  <el-descriptions-item label="退款金额">￥{{ Number(tradeData.refund_amount || 0).toLocaleString() }}</el-descriptions-item>
                  <el-descriptions-item label="退款占比">
                    {{ (Number(tradeData.order_count) > 0 ? (Number(tradeData.refund_count) / Number(tradeData.order_count) * 100).toFixed(2) : 0) }}%
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 商品 -->
        <el-tab-pane label="商品销量 TOP20" name="product">
          <el-row :gutter="16">
            <el-col :span="16">
              <div class="chart-box">
                <div class="chart-title">商品销量排行（Top 10）</div>
                <v-chart v-loading="productLoading" :option="productOption" autoresize style="height: 360px" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="chart-box">
                <div class="chart-title">销量明细</div>
                <el-table :data="productList" border size="small" style="margin-top: 12px" max-height="340">
                  <el-table-column type="index" label="#" width="50" align="center" />
                  <el-table-column label="商品" prop="product_name" show-overflow-tooltip />
                  <el-table-column label="销量" prop="sales_count" width="80" align="center" />
                  <el-table-column label="销售额" width="100" align="center">
                    <template #default="scope">￥{{ scope.row.sales_amount }}</template>
                  </el-table-column>
                </el-table>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 会员 -->
        <el-tab-pane label="会员统计" name="member">
          <el-row :gutter="16" class="stat-row">
            <el-col :span="8">
              <div class="stat-card stat-order">
                <div class="stat-label">会员总数</div>
                <div class="stat-value">{{ memberData.totalMembers ?? 0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-gmv">
                <div class="stat-label">区间新增</div>
                <div class="stat-value">{{ memberData.newMembers ?? 0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card stat-avg">
                <div class="stat-label">下单会员数</div>
                <div class="stat-value">{{ memberData.orderedMembers ?? 0 }}</div>
              </div>
            </el-col>
          </el-row>
          <div class="chart-box">
            <div class="chart-title">近 7 日新增会员</div>
            <v-chart v-loading="memberLoading" :option="memberRecentOption" autoresize style="height: 300px" />
          </div>
        </el-tab-pane>

        <!-- 支付 -->
        <el-tab-pane label="支付统计" name="payment">
          <el-row :gutter="16">
            <el-col :span="10">
              <div class="chart-box">
                <div class="chart-title">支付渠道分布</div>
                <v-chart v-loading="paymentLoading" :option="paymentOption" autoresize style="height: 320px" />
              </div>
            </el-col>
            <el-col :span="14">
              <div class="chart-box">
                <div class="chart-title">渠道明细</div>
                <el-table :data="paymentList" border style="margin-top: 12px">
                  <el-table-column label="渠道" align="center">
                    <template #default="scope">
                      <el-tag :type="scope.row.pay_type === 1 ? 'warning' : 'success'">{{ payTypeLabel(scope.row.pay_type) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="订单数" prop="order_count" align="center" />
                  <el-table-column label="金额（元）" align="center">
                    <template #default="scope">￥{{ Number(scope.row.amount).toLocaleString() }}</template>
                  </el-table-column>
                  <el-table-column label="占比" align="center">
                    <template #default="scope">
                      {{ paymentList.length > 0 ? (Number(scope.row.order_count) / paymentList.reduce((s, p) => s + Number(p.order_count), 0) * 100).toFixed(1) : 0 }}%
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.filter-container { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; color: #303133; }
.header-actions { display: flex; gap: 10px; }
.table-card { margin-bottom: 16px; }
.stat-row { margin-bottom: 16px; }
.stat-card {
  border-radius: 10px; padding: 20px; color: #fff; height: 96px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.stat-label { font-size: 13px; opacity: 0.9; }
.stat-value { font-size: 26px; font-weight: 700; margin-top: 10px; }
.stat-gmv { background: linear-gradient(135deg, #409EFF, #36a3f7); }
.stat-order { background: linear-gradient(135deg, #67C23A, #4ebd61); }
.stat-refund { background: linear-gradient(135deg, #F56C6C, #f78989); }
.stat-avg { background: linear-gradient(135deg, #E6A23C, #f0b45d); }
.chart-box { border: 1px solid #EBEEF5; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
.chart-title { font-weight: 600; color: #303133; margin-bottom: 4px; }
</style>
