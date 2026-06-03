// 时间线页面
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 日期筛选
    filterDate: '',
    // 筛选类型
    filterType: 'all', // all, feed, diaper, sleep, growth
    // 分组后的记录
    groupedRecords: {},
    // 日期列表
    dateList: [],
    // 总记录数
    totalCount: 0,
    // 加载状态
    loading: false
  },

  onLoad: function() {
    this.loadRecords()
  },

  onShow: function() {
    this.loadRecords()
  },

  onPullDownRefresh: function() {
    this.loadRecords()
    wx.stopPullDownRefresh()
  },

  // 加载记录
  loadRecords: function() {
    this.setData({ loading: true })
    
    const records = wx.getStorageSync('localRecords') || []
    
    // 类型筛选
    let filteredRecords = records
    if (this.data.filterType !== 'all') {
      filteredRecords = records.filter(r => r.type === this.data.filterType)
    }
    
    // 日期筛选
    if (this.data.filterDate) {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = r.createdAt.split(' ')[0]
        return recordDate === this.data.filterDate
      })
    }
    
    // 按日期分组
    const grouped = {}
    filteredRecords.forEach(r => {
      const date = r.createdAt.split(' ')[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        typeName: util.getRecordTypeName(r.type),
        color: util.getRecordTypeColor(r.type),
        time: r.createdAt.split(' ')[1].substring(0, 5)
      })
    })
    
    // 按日期排序（倒序）
    const dateList = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
    
    this.setData({
      groupedRecords: grouped,
      dateList: dateList,
      totalCount: filteredRecords.length,
      loading: false
    })
  },

  // 日期筛选
  bindDateFilter: function(e) {
    const date = e.detail.value
    this.setData({ filterDate: date })
    this.loadRecords()
  },

  // 清除日期筛选
  clearDateFilter: function() {
    this.setData({ filterDate: '' })
    this.loadRecords()
  },

  // 类型筛选
  selectFilterType: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ filterType: type })
    this.loadRecords()
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    switch (record.type) {
      case 'feed':
        if (record.method === 'bottle') {
          return `奶瓶 ${record.amount || 0}ml`
        } else {
          const sides = {
            'breast-left': '左侧',
            'breast-right': '右侧',
            'breast-both': '双侧'
          }
          return `母乳 ${sides[record.method] || ''}`
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
              that.loadRecords()
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

  // 跳转到对应记录页面
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
  }
})
