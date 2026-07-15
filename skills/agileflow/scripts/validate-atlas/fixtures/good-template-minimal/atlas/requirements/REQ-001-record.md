# REQ-001 体重记录
**作为** 想减重的用户，**我想** 每天记录体重，**以便** 持续追踪减重进度。

## 验收（BDD）
- **AC-001** Given 用户在记录页输入体重并保存，When 提交成功，Then 该记录按日期写入本地且弹出「已记录」Toast。
- **AC-002** Given 今日已存在体重记录，When 再次保存，Then 覆盖今日记录而非新增重复项。

## 字段
体重记录 `weight`：`{ date:YYYY-MM-DD, weight:Number }`
