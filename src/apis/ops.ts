import http from '@/utils/http'

export interface OpsJob {
  jobId: string
  module: string
  action: string
  argument: string
  operator: string
  requestedAt: string
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  startedAt: string
  finishedAt: string
  exitCode: string
  message: string
}

export interface CmdbAsset {
  version: string; service: string; container: string; image: string
  status: string; health: string; ports: string; createdAt: string
}

export interface OpsOverview {
  configured: boolean
  runnerOnline: boolean
  currentVersion: string
  message: string
  jobs: OpsJob[]
  alertEnabled?: boolean
  alertChannel?: string
  webhookConfigured?: boolean
  checkedAt?: string
  assets?: CmdbAsset[]
}

export type OpsKind = 'deployment' | 'config' | 'monitoring' | 'cmdb'

export const getOpsOverviewAPI = (kind: OpsKind) =>
  http<OpsOverview>({ url: `/ops/${kind}/read/overview`, method: 'get' })

export const getOpsJobLogAPI = (kind: OpsKind, jobId: string) =>
  http<string[]>({ url: `/ops/${kind}/read/jobs/${jobId}/log`, method: 'get' })

export const submitOpsActionAPI = (kind: OpsKind, action: string, argument?: string) => {
  const data = kind === 'deployment' ? { version: argument } : kind === 'config' ? { release: argument } : undefined
  return http<string>({ url: `/ops/${kind}/manage/${action}`, method: 'post', data })
}
