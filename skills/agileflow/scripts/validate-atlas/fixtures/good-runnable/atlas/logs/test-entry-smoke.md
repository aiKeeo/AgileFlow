# 测试入场门禁证据

| 步骤 | 命令 | 结果 |
|------|------|------|
| 编译 | mvn -q -DskipTests package | exit 0 |
| 探针 | curl localhost:8080/actuator/health | UP |
| 冒烟 | curl -X POST /api/login | HTTP 200 PASS |
