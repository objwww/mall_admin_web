# 售后后台页面安全同步测试记录

- 分支：`codex/after-sale-admin-security`
- 提交：本文件所在提交（交付消息记录完整哈希）
- 关联后端：`codex/after-sale-security-closure` / `fde6062`

## 修改说明

| 修改 | 原因与影响 |
|---|---|
| 退款查询改为 `/refund/read/**` | 与后端细粒度只读权限一致，旧路径不再调用 |
| 重试退款不再传 `handleMan` | 操作人由后端登录态决定，前端不能伪造管理员身份 |
| 删除未使用的 `executeRefundAPI` | 当前页面无调用入口，退款由售后流程自动触发；减少误用资金接口的死代码 |
| 删除重复 `returnApply` API 和类型 | 已由 `afterSale` API/类型完整替代，仓库内无引用 |
| 删除售后列表多选列 | 页面没有批量动作，多选状态从未被使用 |
| 不再持久化管理员密码 | Token 认证原本已存在；本次保留请求头 Token，删除明文密码存储 |
| 登录页标题改为中文 | 用户可见页面统一中文 |
| 运行时状态映射改为 `.ts` | `afterSale/refund` 包含中文状态常量，修复 `.d.ts` 无法生成运行时模块导致的构建失败 |

## 业务测试场景

| 编号 | 场景 | 预期 |
|---|---|---|
| AUTH-01 | 未登录访问受保护页面 | 路由守卫跳转中文登录页 |
| AUTH-02 | 登录后请求退款列表 | 请求头携带 `Authorization`，调用 `/refund/read/list` |
| AUTH-03 | Token 失效 | 清理登录态并提示重新登录 |
| AUTH-04 | 刷新浏览器 | Token 可恢复，密码不会出现在持久化 Store |
| RF-01 | 退款失败后点击“重新退款” | 只提交退款 ID，不提交 `handleMan` |
| RF-02 | 打开退款详情 | 调用 `/refund/read/{id}` |
| AS-01 | 售后列表 | 不显示无功能的多选框，筛选与详情保持中文 |

## 自动验证

```text
npm run type-check
npm run build-only
```

说明：`build-only` 用于验证本次页面可产出生产包；全仓 `type-check` 仍会报告其他历史页面的响应解包类型错误，不在本次售后模块中扩散修改。

验证结果：

- `npm run build-only`：通过，生产包构建成功。
- `npm run type-check`：未通过；错误集中在首页、营销、会员、系统等既有页面的 `CommonResult` 解包类型，以及售后页面既有 Element Plus 标签类型。已记录为全仓类型治理待办，本提交不扩大修改范围。
