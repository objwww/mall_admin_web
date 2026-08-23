import http from '@/utils/http'

export interface AgentEvalCase {
  id: number
  caseId: string
  expectedResult: string
  actualResult?: string
  passed: number | boolean
  durationMs?: number
  traceId?: string
  createTime: number
}

export interface AgentEvalRun {
  id: number
  name: string
  agentName: string
  caseFamilyId: string
  caseSessionId?: string
  status: 'RUNNING' | 'FINISHED'
  totalCases: number
  passedCases: number
  score: number
  operatorName: string
  createTime: number
  finishTime?: number
  cases?: AgentEvalCase[]
}

export const getAgentEvalListAPI = (params: Record<string, unknown>) =>
  http<{ list: AgentEvalRun[]; total: number }>({ url: '/agentEval/read/list', method: 'get', params })
export const getAgentEvalDetailAPI = (id: number) =>
  http<AgentEvalRun>({ url: `/agentEval/read/${id}`, method: 'get' })
export const createAgentEvalAPI = (data: { name: string; agentName: string; caseFamilyId: string; caseSessionId?: string }) =>
  http<number>({ url: '/agentEval/manage/run', method: 'post', data })
export const submitAgentEvalCaseAPI = (id: number, data: {
  caseId: string; expectedResult: string; actualResult?: string; durationMs?: number; traceId?: string
}) => http<boolean>({ url: `/agentEval/manage/${id}/case`, method: 'post', data })
export const finishAgentEvalAPI = (id: number) =>
  http<AgentEvalRun>({ url: `/agentEval/manage/${id}/finish`, method: 'post' })
export const createAgentEvalTicketAPI = (id: number) =>
  http<number>({ url: `/agentEval/manage/${id}/ticket`, method: 'post' })
