// 工具函数库

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  if (!date) return ''
  // 如果是时间戳（数字），转换为 Date 对象
  if (typeof date === 'number') {
    // 时间戳可能是秒或毫秒，判断并转换
    date = date < 10000000000 ? new Date(date * 1000) : new Date(date)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间为 YYYY-MM-DD HH:MM
function formatTime(date) {
  if (!date) return ''
  // 如果是时间戳（数字），转换为 Date 对象
  if (typeof date === 'number') {
    date = date < 10000000000 ? new Date(date * 1000) : new Date(date)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 格式化时间为 HH:MM
function formatTimeShort(date) {
  if (!date) return ''
  if (typeof date === 'number') {
    date = date < 10000000000 ? new Date(date * 1000) : new Date(date)
  }
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

// 格式化时长（分钟转为 X小时Y分钟）
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0分钟'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }
  return `${mins}分钟`
}

// 计算两个时间的时长（分钟）
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  return Math.round((end - start) / 60000)
}

// 获取相对时间描述
function getRelativeTime(date) {
  const now = new Date()
  // 如果是时间戳，转换为 Date 对象
  if (typeof date === 'number') {
    date = date < 10000000000 ? new Date(date * 1000) : new Date(date)
  }
  // iOS 不支持 "YYYY-MM-DD HH:mm" 格式，需要转换为 "YYYY-MM-DDTHH:mm:00"
  const iosCompatibleDate = typeof date === 'string' ? date.replace(' ', 'T') + ':00' : date
  const diff = now - new Date(iosCompatibleDate)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(new Date(iosCompatibleDate))
}

// 获取星期几
function getWeekday(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const iosCompatibleDate = typeof date === 'string' ? date.replace(' ', 'T') + ':00' : date
  return weekdays[new Date(iosCompatibleDate).getDay()]
}

// 判断是否是今天
function isToday(date) {
  const today = formatDate(new Date())
  const target = formatDate(new Date(date))
  return today === target
}

// 判断是否是昨天
function isYesterday(date) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDate(yesterday)
  const target = formatDate(new Date(date))
  return yesterdayStr === target
}

// 获取友好的日期显示
function getFriendlyDate(date) {
  if (isToday(date)) return '今天'
  if (isYesterday(date)) return '昨天'
  return `${formatDate(new Date(date))} ${getWeekday(date)}`
}

// 验证是否为空
function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

// 获取记录类型的中文名称
function getRecordTypeName(type) {
  const names = {
    feed: '喂奶',
    diaper: '换尿布',
    sleep: '睡眠',
    growth: '成长'
  }
  return names[type] || '未知'
}

// 获取记录类型的图标
function getRecordTypeIcon(type) {
  const icons = {
    feed: '🍼',
    diaper: '🧷',
    sleep: '😴',
    growth: '📈'
  }
  return icons[type] || '📝'
}

// 获取记录类型的颜色
function getRecordTypeColor(type) {
  const colors = {
    feed: '#FFB6C1',
    diaper: '#B0E0E6',
    sleep: '#DDA0DD',
    growth: '#98FB98'
  }
  return colors[type] || '#FFB6C1'
}

// 数组分组（按日期）
function groupByDate(array) {
  const groups = {}
  array.forEach(item => {
    const date = item.createdAt.split(' ')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  })
  return groups
}

module.exports = {
  formatDate,
  formatTime,
  formatTimeShort,
  formatDuration,
  calculateDuration,
  getRelativeTime,
  getWeekday,
  isToday,
  isYesterday,
  getFriendlyDate,
  isEmpty,
  getRecordTypeName,
  getRecordTypeIcon,
  getRecordTypeColor,
  groupByDate
}
