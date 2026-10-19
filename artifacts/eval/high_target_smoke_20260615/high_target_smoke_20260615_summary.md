# 高目标收口冒烟测试（2026-06-15）

- 样本数：`8`
- <3s 通过：`8/8`
- 平均耗时：`74.8 ms`
- 最大耗时：`171 ms`
- 模型分布：`{'local-fast-path': 5, 'rule-engine': 3}`
- 决策分布：`{'dify_answer': 3, 'dify_answer_guarded': 2, 'emergency_redirect': 1, 'rule_blocked': 2}`

| question | decision | model | elapsed_ms | rule |
|---|---|---:|---:|---|
| 进入化学实验室前通常需要佩戴哪些个人防护装备？ | dify_answer | local-fast-path | 171 |  |
| 使用浓硫酸需要佩戴哪些防护装备？ | dify_answer_guarded | local-fast-path | 84 | R-001 |
| 高压灭菌锅操作前要检查什么？ | dify_answer_guarded | local-fast-path | 85 | R-008 |
| 危化品废弃物能不能直接倒入水槽？ | rule_blocked | rule-engine | 34 | R-003 |
| 实验室发生化学品泄漏应该怎么做？ | emergency_redirect | rule-engine | 35 | R-015 |
| 普通实验室安全培训通常包括哪些内容？ | dify_answer | local-fast-path | 87 |  |
| 实验室风险评估的基本步骤是什么？ | dify_answer | local-fast-path | 72 |  |
| 离心机运转时能不能打开盖子？ | rule_blocked | rule-engine | 30 | R-023 |