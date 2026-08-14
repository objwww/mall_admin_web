<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { str2Date } from '@/utils/datetime'
import img_home_order from '@/assets/images/home_order.png'
import img_home_today_amount from '@/assets/images/home_today_amount.png'
import img_home_yesterday_amount from '@/assets/images/home_yesterday_amount.png'
import { getDashboardStatisticsAPI, getTradeStatisticsAPI } from '@/apis/statistics'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import VChart from 'vue-echarts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

// 通过use()方法按需注入ECharts的模块
use([
  CanvasRenderer, // 画布渲染器
  LineChart, // 折线图的绘制功能
  GridComponent, // 直角坐标系网格组件
  TooltipComponent, // 鼠标悬停时显示数据详情
  LegendComponent,  // 图例组件
  TitleComponent // 显示图表标题
])

// 折线图数据类型
type LineChartDataItem = {
  date: string, // 交易日期
  orderCount: number, // 订单数量
  orderAmount: number // 订单金额
}

// ===== 看板数据 =====
const todayOrderCount = ref(0)
const todayGmv = ref('0.00')
const yesterdayGmv = ref('0.00')
const orderStatus = ref({
  unpaid: 0, undelivered: 0, delivered: 0, completed: 0, closed: 0, returnPending: 0
})
const productOverview = ref({ total: 0, onShelf: 0, offShelf: 0, lowStock: 0 })
const memberOverview = ref({ total: 0, todayNew: 0, yesterdayNew: 0, monthNew: 0 })
const monthOrder = ref({ order_count: 0, amount: 0 })
const weekOrder = ref({ order_count: 0, amount: 0 })
const lastMonthOrder = ref({ order_count: 0, amount: 0 })
const lastWeekOrder = ref({ order_count: 0, amount: 0 })
const advertExpiring = ref(0)
const dashboardLoading = ref(false)

// 加载看板聚合数据
const loadDashboard = async () => {
  dashboardLoading.value = true
  try {
    const res = await getDashboardStatisticsAPI()
    const data = res.data || {}
    todayOrderCount.value = Number(data.todayOrderCount ?? 0)
    todayGmv.value = Number(data.todayGmv ?? 0).toFixed(2)
    yesterdayGmv.value = Number(data.yesterdayGmv ?? 0).toFixed(2)
    if (data.orderStatus) orderStatus.value = data.orderStatus
    if (data.productOverview) productOverview.value = data.productOverview
    if (data.memberOverview) memberOverview.value = data.memberOverview
    if (data.monthOrder) monthOrder.value = data.monthOrder
    if (data.weekOrder) weekOrder.value = data.weekOrder
    if (data.lastMonthOrder) lastMonthOrder.value = data.lastMonthOrder
    if (data.lastWeekOrder) lastWeekOrder.value = data.lastWeekOrder
    advertExpiring.value = Number(data.advertExpiring ?? 0)
  } finally {
    dashboardLoading.value = false
  }
}

// 同比计算（百分比，正负带符号）
const calcRatio = (cur: number, prev: number) => {
  if (!prev) return cur > 0 ? '+100%' : '0%'
  const ratio = ((cur - prev) / prev) * 100
  const rounded = Math.round(ratio * 10) / 10
  return (rounded > 0 ? '+' : '') + rounded + '%'
}
const monthOrderRatio = computed(() => calcRatio(Number(monthOrder.value.order_count), Number(lastMonthOrder.value.order_count)))
const weekOrderRatio = computed(() => calcRatio(Number(weekOrder.value.order_count), Number(lastWeekOrder.value.order_count)))
const monthAmountRatio = computed(() => calcRatio(Number(monthOrder.value.amount), Number(lastMonthOrder.value.amount)))
const weekAmountRatio = computed(() => calcRatio(Number(weekOrder.value.amount), Number(lastWeekOrder.value.amount)))

// ===== 折线图（订单统计趋势） =====
// 日期选择器日期范围[start,end]
const datePickerRange = ref<Date[]>([])
// 初始化日期选择器数据：默认最近7天
const initDatePickerRange = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 6)
  datePickerRange.value = [start, end] as Date[]
}
// 图表数据
const lineChartData = ref<LineChartDataItem[]>([])
// 图表数据加载状态
const loading = ref(false)
// 获取图表数据（真实交易趋势）
const getLineChartData = async () => {
  const start = datePickerRange.value[0]
  const end = datePickerRange.value[1]
  if (!start || !end) return
  loading.value = true
  try {
    const fmt = (d: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    const res = await getTradeStatisticsAPI({
      startTime: fmt(start),
      endTime: fmt(end),
    })
    const data = res.data || {}
    const trend: Array<{ day: string; order_count: number; gmv: number }> = data.trend || []
    lineChartData.value = trend.map((t) => ({
      date: t.day,
      orderCount: Number(t.order_count ?? 0),
      orderAmount: Number(t.gmv ?? 0),
    }))
  } catch (e) {
    console.error('加载交易趋势失败:', e)
  } finally {
    loading.value = false
  }
}

// 组件挂载成功初始化数据
onMounted(() => {
  initDatePickerRange()
  loadDashboard()
  getLineChartData()
})

// 日期选择器选项
const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 6)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 29)
      return [start, end]
    }
  }
]
// 处理日期范围变化
const handleDatePickerRangeChange = () => {
  getLineChartData()
}

// 图表选项
const chartOption = computed(() => {
  const dates = lineChartData.value.map(item => item.date)
  const orderCounts = lineChartData.value.map(item => item.orderCount)
  const orderAmounts = lineChartData.value.map(item => item.orderAmount)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        formatter: '{value}',
        rotate: 0
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数量',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '订单金额',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '订单数量',
        type: 'line',
        areaStyle: {},
        data: orderCounts,
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '订单金额',
        type: 'line',
        yAxisIndex: 1,
        areaStyle: {},
        data: orderAmounts,
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
})
</script>

<template>
  <div class="app-container">
    <div class="total-layout">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="total-frame">
            <img :src="img_home_order" class="total-icon">
            <div class="total-title">今日订单总数</div>
            <div class="total-value">{{ todayOrderCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="total-frame">
            <img :src="img_home_today_amount" class="total-icon">
            <div class="total-title">今日销售总额</div>
            <div class="total-value">￥{{ todayGmv }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="total-frame">
            <img :src="img_home_yesterday_amount" class="total-icon">
            <div class="total-title">昨日销售总额</div>
            <div class="total-value">￥{{ yesterdayGmv }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="un-handle-layout">
      <div class="layout-title">待处理事务</div>
      <div class="un-handle-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">待付款订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.unpaid }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">已完成订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.completed }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">待确认收货订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.delivered }})</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">待发货订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.undelivered }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">新缺货登记</span>
              <span style="float: right" class="color-danger">({{ productOverview.lowStock }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">待处理退款申请</span>
              <span style="float: right" class="color-danger">({{ orderStatus.returnPending }})</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">已发货订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.delivered }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">待处理退货订单</span>
              <span style="float: right" class="color-danger">({{ orderStatus.returnPending }})</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item">
              <span class="font-medium">广告位即将到期</span>
              <span style="float: right" class="color-danger">({{ advertExpiring }})</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="overview-layout">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="out-border">
            <div class="layout-title">商品总览</div>
            <div style="padding: 40px">
              <el-row>
                <el-col :span="6" class="color-danger overview-item-value">{{ productOverview.offShelf }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ productOverview.onShelf }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ productOverview.lowStock }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ productOverview.total }}</el-col>
              </el-row>
              <el-row class="font-medium">
                <el-col :span="6" class="overview-item-title">已下架</el-col>
                <el-col :span="6" class="overview-item-title">已上架</el-col>
                <el-col :span="6" class="overview-item-title">库存紧张</el-col>
                <el-col :span="6" class="overview-item-title">全部商品</el-col>
              </el-row>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="out-border">
            <div class="layout-title">用户总览</div>
            <div style="padding: 40px">
              <el-row>
                <el-col :span="6" class="color-danger overview-item-value">{{ memberOverview.todayNew }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ memberOverview.yesterdayNew }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ memberOverview.monthNew }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ memberOverview.total }}</el-col>
              </el-row>
              <el-row class="font-medium">
                <el-col :span="6" class="overview-item-title">今日新增</el-col>
                <el-col :span="6" class="overview-item-title">昨日新增</el-col>
                <el-col :span="6" class="overview-item-title">本月新增</el-col>
                <el-col :span="6" class="overview-item-title">会员总数</el-col>
              </el-row>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="statistics-layout">
      <div class="layout-title">订单统计</div>
      <el-row>
        <el-col :span="4">
          <div style="padding: 20px">
            <div>
              <div style="color: #909399;font-size: 14px">本月订单总数</div>
              <div style="color: #606266;font-size: 24px;padding: 10px 0">{{ monthOrder.order_count }}</div>
              <div>
                <span class="color-success" style="font-size: 14px">{{ monthOrderRatio }}</span>
                <span style="color: #C0C4CC;font-size: 14px">同比上月</span>
              </div>
            </div>
            <div style="margin-top: 20px;">
              <div style="color: #909399;font-size: 14px">本周订单总数</div>
              <div style="color: #606266;font-size: 24px;padding: 10px 0">{{ weekOrder.order_count }}</div>
              <div>
                <span class="color-danger" style="font-size: 14px">{{ weekOrderRatio }}</span>
                <span style="color: #C0C4CC;font-size: 14px">同比上周</span>
              </div>
            </div>
            <div style="margin-top: 20px;">
              <div style="color: #909399;font-size: 14px">本月销售总额</div>
              <div style="color: #606266;font-size: 24px;padding: 10px 0">￥{{ monthOrder.amount }}</div>
              <div>
                <span class="color-success" style="font-size: 14px">{{ monthAmountRatio }}</span>
                <span style="color: #C0C4CC;font-size: 14px">同比上月</span>
              </div>
            </div>
            <div style="margin-top: 20px;">
              <div style="color: #909399;font-size: 14px">本周销售总额</div>
              <div style="color: #606266;font-size: 24px;padding: 10px 0">￥{{ weekOrder.amount }}</div>
              <div>
                <span class="color-danger" style="font-size: 14px">{{ weekAmountRatio }}</span>
                <span style="color: #C0C4CC;font-size: 14px">同比上周</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="20">
          <div style="padding: 10px;border-left:1px solid #DCDFE6">
            <el-date-picker style="float: right;z-index: 1" size="small" v-model="datePickerRange" type="daterange"
              align="right" unlink-panels range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
              :shortcuts="shortcuts" @change="handleDatePickerRangeChange">
            </el-date-picker>
            <div style="height: 400px;">
              <v-chart v-if="!loading" :option="chartOption" autoresize />
              <div v-else
                style="display: flex; justify-content: center; align-items: center; height: 100%;width: 100%;">
                <el-skeleton :rows="5" animated />
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  margin-top: 40px;
  margin-left: 120px;
  margin-right: 120px;
}

.total-layout {
  margin-top: 20px;
}

.total-frame {
  border: 1px solid #DCDFE6;
  padding: 20px;
  height: 100px;
}

.total-icon {
  color: #409EFF;
  width: 60px;
  height: 60px;
}

.total-title {
  position: relative;
  font-size: 16px;
  color: #909399;
  left: 70px;
  top: -50px;
}

.total-value {
  position: relative;
  font-size: 18px;
  color: #606266;
  left: 70px;
  top: -40px;
}

.un-handle-layout {
  margin-top: 20px;
  border: 1px solid #DCDFE6;
}

.layout-title {
  color: #606266;
  padding: 15px 20px;
  background: #F2F6FC;
  font-weight: bold;
}

.un-handle-content {
  padding: 20px 40px;
}

.un-handle-item {
  border-bottom: 1px solid #EBEEF5;
  padding: 10px;
}

.overview-layout {
  margin-top: 20px;
}

.overview-item-value {
  font-size: 24px;
  text-align: center;
}

.overview-item-title {
  margin-top: 10px;
  text-align: center;
}

.out-border {
  border: 1px solid #DCDFE6;
}

.statistics-layout {
  margin-top: 20px;
  border: 1px solid #DCDFE6;
}
</style>
