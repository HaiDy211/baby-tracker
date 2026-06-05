// 首页 - 仪表盘
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    babyName: '请添加宝宝',
    currentBaby: null,
    babies: [],
    showBabyPicker: false,
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
    // 检查登录状态
    this.checkLogin()
  },

  onShow: function() {
    // 每次显示时刷新数据
    this.loadData()
  },

  onPullDownRefresh: function() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 检查登录状态
  checkLogin: function() {
    const isLoggedIn = app.globalData.isLoggedIn
    const hasFamily = !!app.globalData.familyInfo

    if (!isLoggedIn) {
      // 未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    if (isLoggedIn && !hasFamily) {
      // 已登录但没有家庭
      wx.redirectTo({
        url: '/pages/family/family'
      })
      return
    }
  },

  // 加载数据
  loadData: function() {
    if (!app.globalData.familyInfo) return

    const familyInfo = app.globalData.familyInfo
    const currentBaby = app.globalData.currentBaby

    this.setData({
      babyName: currentBaby ? currentBaby.name : '请添加宝宝',
      currentBaby: currentBaby,
      babies: familyInfo.babies || []
    })

    // 如果没有宝宝，提示添加
    if (!currentBaby || familyInfo.babies.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先添加宝宝',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/babies/babies'
          })
        }
      })
      return
    }

    // 获取今日统计
    app.getTodayStats().then(stats => {
      this.setData({ todayStats: stats })
    }).catch(err => {
      console.error('获取统计失败', err)
    })

    // 获取最近记录
    app.getRecords({ limit: 5 }).then(records => {
      const recentRecords = records.map(r => ({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        typeName: util.getRecordTypeName(r.type),
        relativeTime: util.getRelativeTime(r._createTime),
        color: util.getRecordTypeColor(r.type),
        detail: this.getRecordDetail(r)
      }))
      this.setData({ recentRecords })
    }).catch(err => {
      console.error('获取记录失败', err)
    })
  },

  // 显示宝宝选择器
  showBabyPicker: function() {
    this.setData({ showBabyPicker: true })
  },

  // 隐藏宝宝选择器
  hideBabyPicker: function() {
    this.setData({ showBabyPicker: false })
  },

  // 选择宝宝
  onSelectBaby: function(e) {
    const babyId = e.currentTarget.dataset.id
    app.switchBaby(babyId)
    this.setData({ showBabyPicker: false })
    this.loadData()
    wx.showToast({
      title: '已切换',
      icon: 'success'
    })
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
    const data = record.data || record
    switch (record.type) {
      case 'feed':
        if (data.method === 'bottle') {
          return `奶瓶 ${data.amount}ml`
        } else {
          const sides = { 'breast-left': '左侧', 'breast-right': '右侧', 'breast-both': '双侧' }
          return `母乳 ${sides[data.method] || ''}`
        }
      case 'diaper':
        const types = []
        if (data.wet) types.push('湿')
        if (data.dirty) types.push('脏')
        return types.join('+') || '换尿布'
      case 'sleep':
        if (data.wakeTime) {
          const duration = util.calculateDuration(data.sleepTime, data.wakeTime)
          return `睡眠 ${util.formatDuration(duration)}`
        }
        return '入睡中'
      case 'growth':
        const items = []
        if (data.weight) items.push(`体重${data.weight}kg`)
        if (data.height) items.push(`身高${data.height}cm`)
        if (data.headCircumference) items.push(`头围${data.headCircumference}cm`)
        return items.join(' | ') || '成长记录'
      default:
        return ''
    }
  }
})
