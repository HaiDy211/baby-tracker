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
    const that = this
    this.setData({ loading: true })
    
    app.getRecords().then(records => {
      console.log('timeline 获取到记录数:', records ? records.length : 0)
      console.log('timeline 记录列表:', records)
      
      // 类型筛选
      let filteredRecords = records
      if (that.data.filterType !== 'all') {
        filteredRecords = records.filter(r => r.type === that.data.filterType)
      }
      
      // 日期筛选
      if (that.data.filterDate) {
        filteredRecords = filteredRecords.filter(r => {
          const timestamp = r.createdAt || r._createTime || Date.now()
          const recordDate = util.formatDate(timestamp)
          return recordDate === that.data.filterDate
        })
      }
      
      // 按日期分组
      const grouped = {}
      filteredRecords.forEach(r => {
        // 获取时间戳，优先使用 _createTime（云数据库自动生成的时间戳）
        // 其次是 createdAt（保存时的字符串日期）
        let timestamp
        let dateStr = ''
        let timeStr = ''
        
        if (r._createTime) {
          // 云数据库时间戳是秒级，需要转换为毫秒
          timestamp = r._createTime < 10000000000 ? r._createTime * 1000 : r._createTime
          dateStr = util.formatDate(timestamp)
          timeStr = util.formatTime(timestamp).substring(0, 5)
        } else if (r.createdAt) {
          // 如果是字符串日期，如 "2026-06-04 13:53:00"
          const parts = r.createdAt.split(' ')
          dateStr = parts[0] // "2026-06-04"
          timeStr = parts[1] ? parts[1].substring(0, 5) : '' // "13:53"
        } else {
          timestamp = Date.now()
          dateStr = util.formatDate(timestamp)
          timeStr = util.formatTime(timestamp).substring(0, 5)
        }
        
        if (!grouped[dateStr]) {
          grouped[dateStr] = []
        }
        grouped[dateStr].push({
          ...r,
          id: r._id,
          createdAt: dateStr + ' ' + timeStr,
          icon: util.getRecordTypeIcon(r.type),
          typeName: util.getRecordTypeName(r.type),
          color: util.getRecordTypeColor(r.type),
          time: timeStr,
          detail: that.getRecordDetail(r)
        })
      })
      
      // 按日期排序（倒序）
      const dateList = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
      
      that.setData({
        groupedRecords: grouped,
        dateList: dateList,
        totalCount: filteredRecords.length,
        loading: false
      })
    }).catch(err => {
      console.error('加载记录失败', err)
      that.setData({ loading: false })
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
    // 获取实际数据对象
    const data = record.data || record
    
    switch (record.type) {
      case 'feed':
        const method = data.method
        if (method === 'bottle') {
          return `奶瓶 ${data.amount || 0}ml`
        } else {
          const sides = {
            'breast-left': '左侧',
            'breast-right': '右侧',
            'breast-both': '双侧',
            'breast': '亲喂'
          }
          return `母乳 ${sides[method] || '亲喂'}`
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
          app.deleteRecord(recordId).then(result => {
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
