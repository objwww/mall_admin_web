import http from '@/utils/http'

export interface AgentToolCall {
  toolCallId: string
  sequenceNo: number
  toolName: string
  status: 'STARTED' | 'SUCCESS' | 'FAILED'
  inputJson?: string
  outputJson?: string
  errorMessage?: string
  startedAt: number
  finishedAt?: number
  durationMs?: number
}

export interface AgentOperationRun {
  runId: string
  agentName: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  traceId?: string
  evaluationRunId?: number
  inputSummary?: string
  outputSummary?: string
  errorMessage?: string
  startedAt: number
  finishedAt?: number
  durationMs?: number
  toolCalls?: AgentToolCall[]
}

export const getAgentOperationListAPI = (params: Record<string, unknown>) =>
  http<{ list: AgentOperationRun[]; total: number }>({ url: '/agentOps/read/list', method: 'get', params })

export const getAgentOperationDetailAPI = (runId: string) =>
  http<AgentOperationRun>({ url: `/agentOps/read/${encodeURIComponent(runId)}`, method: 'get' })
