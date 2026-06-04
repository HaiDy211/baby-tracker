# 宝宝成长记录小程序

一款温馨的微信小程序，帮助新手爸妈记录宝宝的日常生活，包括喂奶、换尿布、睡眠和成长数据。

## 功能特性

### 📊 首页仪表盘
- 今日概览：喂奶次数、换尿布次数、睡眠时长
- 快捷记录按钮，一键跳转到对应记录页
- 最近记录列表

### 🍼 喂奶记录
- 支持母乳（左侧/右侧/双侧）
- 支持奶瓶喂养（毫升数）
- 自定义记录时间
- 备注功能

### 🧷 换尿布记录
- 湿尿布/脏尿布/混合状态
- 一键记录

### 😴 睡眠记录
- 记录入睡时间和醒来时间
- 自动计算睡眠时长
- 支持"宝宝睡着了"和"宝宝醒来了"两种模式

### 📈 成长记录
- 体重(kg)、身高(cm)、头围(cm)
- 折线图展示趋势
- 历史数据查看

### 📋 时间线
- 所有记录按时间倒序排列
- 按日期筛选
- 按类型筛选（喂奶/尿布/睡眠/成长）

### 👤 我的
- 设置宝宝姓名、出生日期、性别
- 数据统计
- 清除所有数据

## 技术实现

- **前端框架**：微信小程序原生开发
- **云开发**：支持云数据库存储
- **本地存储**：使用 wx.setStorageSync 本地缓存
- **UI风格**：柔和马卡龙色系，圆角卡片布局

## 文件结构

```
baby-tracker/
├── app.js                    # 小程序入口
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json
├── cloudfunctions/           # 云函数
│   └── addRecord/
├── pages/                    # 页面
│   ├── index/                # 首页
│   ├── feed/                 # 喂奶记录
│   ├── diaper/               # 换尿布记录
│   ├── sleep/                # 睡眠记录
│   ├── growth/               # 成长记录
│   ├── timeline/             # 时间线
│   └── my/                   # 我的
├── utils/                    # 工具函数
│   ├── util.js
│   └── db.js
└── images/                   # TabBar图标
```

## 快速开始

### 1. 配置云开发环境

在 `app.js` 中设置云开发环境ID：

```javascript
globalData: {
  envId: 'your-env-id',  // 替换为你的云开发环境ID
}
```

### 2. 添加TabBar图标

在 `images/` 目录下添加TabBar图标文件（推荐尺寸 81x81 像素）：

- `home.png` / `home-active.png`
- `timeline.png` / `timeline-active.png`
- `my.png` / `my-active.png`

如果暂时没有图标，可以删除 `app.json` 中的 `iconPath` 和 `selectedIconPath`。

### 3. 开通云开发

1. 在微信开发者工具中右键项目
2. 选择"开通云开发"
3. 创建环境后，将环境ID填入 `app.js`

### 4. 创建数据库集合

在云开发控制台创建 `records` 集合：

1. 打开云开发控制台
2. 进入"数据库"
3. 点击"新建集合"，名称填写 `records`
4. 设置集合权限为"自定义安全规则"或"仅创建者可读写"

## 使用说明

1. 打开小程序，进入"我的"页面设置宝宝信息
2. 在首页点击快捷按钮开始记录
3. 查看时间线了解历史记录
4. 在成长页面查看成长趋势图

## 数据存储

### records 集合字段说明

```javascript
{
  _id: '',           // 自动生成的ID
  type: '',          // 记录类型：feed/diaper/sleep/growth
  createdAt: '',     // 创建时间
  // 根据类型不同，还有其他字段...
}
```

### 喂奶记录 (feed)
```javascript
{
  type: 'feed',
  method: 'breast-left' | 'breast-right' | 'breast-both' | 'bottle',
  amount: 120,       // 仅奶瓶喂养时有，单位ml
  note: ''
}
```

### 换尿布记录 (diaper)
```javascript
{
  type: 'diaper',
  wet: true,         // 是否湿
  dirty: true,       // 是否脏
  note: ''
}
```

### 睡眠记录 (sleep)
```javascript
{
  type: 'sleep',
  sleepTime: '',     // 入睡时间
  wakeTime: '',      // 醒来时间（可选）
  note: ''
}
```

### 成长记录 (growth)
```javascript
{
  type: 'growth',
  weight: 3.5,       // 体重，单位kg
  height: 50,        // 身高，单位cm
  headCircumference: 34,  // 头围，单位cm
  note: ''
}
```

## 本地存储

如果未配置云开发，数据会存储在本地：

- `babyInfo` - 宝宝信息
- `localRecords` - 记录列表

## 注意事项

1. 请确保在小程序内输入正确的出生日期以计算宝宝年龄
2. 长按记录可以删除
3. 所有时间默认当前时间，可手动修改
4. 断网时数据会存储在本地，恢复网络后可同步到云端

## 更新日志

### v1.0.0
- 初始版本
- 支持喂奶、换尿布、睡眠、成长记录
- 支持本地存储和云开发

## 许可证

MIT License
