// 首页 - 仪表盘
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    babyName: '小宝宝',
    todayStats: {
      feedCount: 0,
      diaperCount: 0,
      sleepHours: '0.0'
    },
    recentRecords: [],
    showQuickAction: false,
    quickActions: [
      { type: 'feed', icon: '🍼', title: '喂奶', color: '#FFB6C1' },
      { type: 'diaper', icon: '🧷', title: '换尿布', color: '#B0E0E6' },
      { type: 'sleep', icon: '😴', title: '睡觉', color: '#DDA0DD' },
      { type: 'growth', icon: '📈', title: '成长', color: '#98FB98' }
    ]
  },

  onLoad: function() {
    // 加载宝宝信息
    const babyInfo = app.globalData.babyInfo
    if (babyInfo && babyInfo.name) {
      this.setData({ babyName: babyInfo.name })
    }
  },

  onShow: function() {
    this.loadData()
  },

  onPullDownRefresh: function() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 加载数据
  loadData: function() {
    // 获取今日统计
    const stats = app.getTodayStats()
    this.setData({ todayStats: stats })

    // 获取最近记录
    const records = wx.getStorageSync('localRecords') || []
    const recentRecords = records.slice(0, 5).map(r => ({
      ...r,
      icon: util.getRecordTypeIcon(r.type),
      typeName: util.getRecordTypeName(r.type),
      relativeTime: util.getRelativeTime(r.createdAt),
      color: util.getRecordTypeColor(r.type)
    }))
    this.setData({ recentRecords })
  },

  // 显示快捷操作弹窗
  showQuickActions: function() {
    this.setData({ showQuickAction: true })
  },

  // 隐藏快捷操作弹窗
  hideQuickActions: function() {
    this.setData({ showQuickAction: false })
  },

  // 快捷操作选择
  onQuickAction: function(e) {
    const type = e.currentTarget.dataset.type
    this.hideQuickActions()
    
    const pages = {
      feed: '/pages/feed/feed',
      diaper: '/pages/diaper/diaper',
      sleep: '/pages/sleep/sleep',
      growth: '/pages/growth/growth'
    }
    
    wx.navigateTo({
      url: pages[type]
    })
  },

  // 跳转到记录页面
  goToRecord: function(e) {
    const type = e.currentTarget.dataset.type
    const pages = {
      feed: '/pages/feed/feed',
      diaper: '/pages/diaper/diaper',
      sleep: '/pages/sleep/sleep',
      growth: '/pages/growth/growth'
    }
    wx.navigateTo({
      url: pages[type]
    })
  },

  // 跳转到时间线
  goToTimeline: function() {
    wx.switchTab({
      url: '/pages/timeline/timeline'
    })
  },

  // 长按删除记录
  onLongPressRecord: function(e) {
    const recordId = e.currentTarget.dataset.id
    const that = this
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#FF6B8A',
      success: function(res) {
        if (res.confirm) {
          app.deleteRecord(recordId, function(result) {
            if (result.success) {
              that.loadData()
              wx.showToast({
                title: '已删除',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 点击记录跳转到编辑页面
  onTapRecord: function(e) {
    const recordId = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    
    const pages = {
      feed: '/pages/feed/feed',
      diaper: '/pages/diaper/diaper',
      sleep: '/pages/sleep/sleep',
      growth: '/pages/growth/growth'
    }
    
    wx.navigateTo({
      url: `${pages[type]}?recordId=${recordId}`
    })
  },

  // 获取记录详情文本
  getRecordDetail: function(record) {
    switch (record.type) {
      case 'feed':
        if (record.method === 'bottle') {
          return `奶瓶 ${record.amount}ml`
        } else {
          return `母乳 ${record.method === 'left' ? '左侧' : record.method === 'right' ? '右侧' : '双侧'}`
        }
      case 'diaper':
        const types = []
        if (record.wet) types.push('湿')
        if (record.dirty) types.push('脏')
        return types.join('+') || '换尿布'
      case 'sleep':
        if (record.wakeTime) {
          const duration = util.calculateDuration(record.sleepTime, record.wakeTime)
          return `睡眠 ${util.formatDuration(duration)}`
        }
        return '入睡中'
      case 'growth':
        const items = []
        if (record.weight) items.push(`体重${record.weight}kg`)
        if (record.height) items.push(`身高${record.height}cm`)
        if (record.headCircumference) items.push(`头围${record.headCircumference}cm`)
        return items.join(' | ') || '成长记录'
      default:
        return ''
    }
  }
})
