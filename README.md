# 班级宠物园 (ClassPetGarden) 🐾

> 班级积分管理 + 电子宠物养成系统
> 
> 游戏化班级管理，提升学生积极性

## 项目简介

班级宠物园是一个面向教师和学生的班级管理工具，将积分系统与电子宠物养成结合，让班级管理变得有趣高效。

### 核心特点

- 🎓 **班级管理** - 创建多个班级，轻松切换
- 👨‍🎓 **学生管理** - 添加、搜索、批量导入学生
- 🐶 **宠物养成** - 24种宠物，8级成长体系
- ⭐ **积分系统** - 自定义评价规则，覆盖学习、行为、健康等
- 🏆 **排行榜** - 荣誉榜激励学生
- 🛒 **小商店** - 积分兑换奖励
- 🏅 **徽章系统** - 宠物毕业获得专属徽章

---

## 功能清单

### 一、顶部导航栏

| 功能 | 说明 |
|------|------|
| Logo + 班级选择器 | 下拉切换班级 |
| 设置与帮助 | 应用设置和使用帮助 |

### 二、左侧工具栏

| 功能 | 说明 |
|------|------|
| 🔍 搜索学生 | 快速查找学生 |
| 📝 姓名排序 | 升序/降序排序 |
| 🏆 排行榜 | 按积分/等级排名 |
| 🛒 小商店 | 积分兑换商品 |
| 📋 评价记录 | 历史记录，支持导出 |
| ↩️ 撤回评价 | 撤销最近操作 |
| ✅ 批量评价 | 多选批量加分/扣分 |

### 三、班级管理

- 创建/编辑/删除班级
- 顶部下拉切换班级
- 显示当前使用班级

### 四、学生管理

- 添加学生（姓名 + 学号）
- 批量导入学生名单
- 编辑/删除学生
- 搜索、排序学生

### 五、宠物系统

#### 宠物类型（24种）

**普通动物（16种）**：
- 犬类：西高地、比熊、边牧、柴犬、金毛、萨摩耶、哈士奇
- 猫类：虎斑猫、加菲猫、布偶猫、橘猫
- 兔类：垂耳兔、安哥拉兔
- 其他：柯尔鸭、羊驼、小熊猫

**神兽类（8种）**：
- 白虎、独角兽、貔貅、青龙、朱雀、狻猊、多肉精灵

#### 成长系统

| 等级 | 所需积分 | 说明 |
|------|----------|------|
| Lv.1 → Lv.2 | 40 | 初始等级 |
| Lv.2 → Lv.3 | 60 | |
| Lv.3 → Lv.4 | 80 | |
| Lv.4 → Lv.5 | 100 | |
| Lv.5 → Lv.6 | 120 | |
| Lv.6 → Lv.7 | 140 | |
| Lv.7 → Lv.8 | 160 | 毕业等级 |
| **Lv.8 毕业** | - | 获得专属徽章 |

### 六、评价系统

#### 评价分类（支持自定义）

**默认分类**：学习、行为、健康、其他

**支持功能**：
- 新增自定义评价项
- 编辑评价项（名称、分值）
- 删除评价项
- 按分类管理

#### 默认评价规则（83条）

| 分类 | 加分项 | 扣分项 |
|------|--------|--------|
| 学习 | 9条 | 7条 |
| 行为 | 13条 | 19条 |
| 健康 | 7条 | 7条 |
| 其他 | 16条 | 5条 |

#### 学习类示例

| 指标 | 分值 |
|------|------|
| 作业完成优秀 | +1 |
| 平时测验满分 | +3 |
| 被老师点名表扬 | +1 |
| 不交作业 | -1 |
| 抄袭作业 | -5 |
| 考试作弊 | -5 |

#### 行为类示例

| 指标 | 分值 |
|------|------|
| 主动帮助同学 | +2 |
| 拾金不昧 | +2~+5 |
| 欺负同学 | -10 |
| 说脏话骂人 | -2 |

### 七、小商店

- 商品管理（名称、价格、库存）
- 积分兑换
- 兑换记录

### 八、排行榜（荣誉榜）

- 排名、学生姓名、宠物、等级、徽章数
- 激励学生积极表现

---

## 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| Vue 3 + TypeScript | 前端框架 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| Pinia | 状态管理 |
| Vue Router | 路由 |

### 后端

| 技术 | 用途 |
|------|------|
| Node.js + Express | 后端服务 |
| SQLite | 数据库（轻量、可靠） |
| better-sqlite3 | SQLite 同步驱动 |

---

## 数据持久化方案

### 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    班级宠物园架构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────┐         ┌─────────────────┐      │
│   │    Vue 3 前端    │   API   │   Node.js 后端  │      │
│   │                 │ ←─────→ │                 │      │
│   │  - Pinia 状态   │   JSON  │  - Express API  │      │
│   │  - Tailwind UI  │         │  - 业务逻辑     │      │
│   └─────────────────┘         └────────┬────────┘      │
│                                        │               │
│                                        ▼               │
│                                ┌─────────────────┐     │
│                                │     SQLite      │     │
│                                │                 │     │
│                                │  - 班级数据     │     │
│                                │  - 学生数据     │     │
│                                │  - 评价记录     │     │
│                                │  - 商店商品     │     │
│                                └─────────────────┘     │
│                                        │               │
│                                        ▼               │
│                                ┌─────────────────┐     │
│                                │   数据库文件    │     │
│                                │  pet-garden.db  │     │
│                                │                 │     │
│                                │  可备份、可迁移 │     │
│                                └─────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 为什么选择后端 + SQLite？

| 对比项 | 前端存储 | 后端 + SQLite |
|--------|----------|---------------|
| **数据安全** | 浏览器清除会丢失 | ✅ 永久保存 |
| **多设备** | 无法同步 | ✅ 任意设备访问 |
| **数据备份** | 手动导出 | ✅ 数据库文件备份 |
| **多人协作** | ❌ 不支持 | ✅ 多老师管理同班级 |
| **数据迁移** | 复杂 | ✅ 复制 db 文件即可 |
| **性能** | 一般 | ✅ SQLite 高效 |
| **部署难度** | 简单 | 简单（单个 db 文件） |

### API 设计

```
# 班级管理
GET    /api/classes              # 获取班级列表
POST   /api/classes              # 创建班级
PUT    /api/classes/:id          # 更新班级
DELETE /api/classes/:id          # 删除班级

# 学生管理
GET    /api/classes/:id/students # 获取班级学生
POST   /api/students             # 添加学生
PUT    /api/students/:id         # 更新学生
DELETE /api/students/:id         # 删除学生
POST   /api/students/import      # 批量导入

# 宠物系统
PUT    /api/students/:id/pet     # 选择/更换宠物
POST   /api/students/:id/feed    # 喂食（加分）

# 评价系统
GET    /api/rules                # 获取评价规则
POST   /api/rules                # 添加自定义规则
PUT    /api/rules/:id            # 更新规则
DELETE /api/rules/:id            # 删除规则
POST   /api/evaluations          # 添加评价记录
GET    /api/evaluations          # 获取评价记录
DELETE /api/evaluations/latest   # 撤回最近评价

# 排行榜
GET    /api/classes/:id/ranking  # 获取排行榜

# 小商店
GET    /api/shop/items           # 获取商品
POST   /api/shop/items           # 添加商品
PUT    /api/shop/items/:id       # 更新商品
DELETE /api/shop/items/:id       # 删除商品
POST   /api/shop/exchange        # 兑换商品

# 数据管理
GET    /api/backup               # 导出备份
POST   /api/restore              # 导入恢复
```

### 数据库表结构

```sql
-- 班级表
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

-- 学生表
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  student_no TEXT,
  total_points INTEGER DEFAULT 0,
  pet_type TEXT,
  pet_level INTEGER DEFAULT 1,
  pet_exp INTEGER DEFAULT 0,
  created_at INTEGER,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 徽章表
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  earned_at INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 评价规则表
CREATE TABLE evaluation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  created_at INTEGER
);

-- 评价记录表
CREATE TABLE evaluation_records (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp INTEGER,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 商品表
CREATE TABLE shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  image TEXT
);

-- 兑换记录表
CREATE TABLE exchange_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT,
  price INTEGER,
  timestamp INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 设置表
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

### 数据安全措施

| 措施 | 说明 |
|------|------|
| **数据库文件备份** | 定期备份 `pet-garden.db` |
| **导出功能** | 支持导出完整 JSON 备份 |
| **事务保护** | 关键操作使用事务 |
| **输入验证** | 后端校验所有输入 |

---

## 项目结构

```
class-pet-garden/
├── src/
│   ├── components/
│   │   ├── layout/          # 布局组件
│   │   ├── student/         # 学生卡片
│   │   ├── pet/             # 宠物组件
│   │   └── modals/          # 弹窗组件
│   ├── pages/
│   │   └── Home.vue         # 主页面
│   ├── stores/
│   │   ├── class.ts         # 班级状态
│   │   ├── student.ts       # 学生状态
│   │   ├── pet.ts           # 宠物状态
│   │   ├── evaluation.ts    # 评价状态
│   │   └── shop.ts          # 商店状态
│   ├── data/
│   │   ├── pets.ts          # 宠物配置
│   │   └── evaluation-rules.ts  # 评价规则（默认）
│   ├── utils/
│   │   └── storage.ts       # 本地存储
│   ├── App.vue
│   └── main.ts
├── public/
│   └── images/pets/         # 宠物图片
└── README.md
```

---

## 开发计划

### Phase 1: 基础框架
- [ ] 项目初始化
- [ ] 布局组件（顶栏、侧栏、主内容区）
- [ ] 基础样式

### Phase 2: 核心功能
- [ ] 班级管理（创建、切换、编辑、删除）
- [ ] 学生管理（添加、搜索、排序）
- [ ] 宠物系统（选择、更换、成长）
- [ ] 评价系统（加分、扣分、自定义规则）

### Phase 3: 高级功能
- [ ] 排行榜
- [ ] 小商店
- [ ] 评价记录
- [ ] 批量评价
- [ ] 徽章系统

### Phase 4: 优化
- [ ] UI 美化
- [ ] 动画效果
- [ ] 响应式适配

---

## 许可证

MIT License