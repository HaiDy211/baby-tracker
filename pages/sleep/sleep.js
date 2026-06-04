// 睡眠记录页面
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 睡眠状态: sleeping(入睡中) / wokeup(已醒来)
    sleepStatus: 'sleeping',
    // 入睡时间
    sleepTime: '',
    sleepDate: '',
    // 醒来时间
    wakeTime: '',
    wakeDate: '',
    // 预计时长
    durationText: '',
    // 备注
    note: '',
    // 最近记录
    recentRecords: []
  },

  onLoad: function(options) {
    // 检查是否从首页快捷按钮进入（默认记录入睡）
    const type = options.type
    if (type === 'wakeup') {
      this.setData({ sleepStatus: 'wokeup' })
    }
    
    this.initTime()
    this.loadRecentRecords()
  },

  onShow: function() {
    this.loadRecentRecords()
    this.updateDuration()
  },

  // 初始化时间
  initTime: function() {
    const now = new Date()
    const time = util.formatTimeShort(now)
    const date = util.formatDate(now)
    
    this.setData({
      sleepTime: time,
      sleepDate: date,
      wakeTime: time,
      wakeDate: date,
      durationText: '选择时间后自动计算'
    })
  },

  // 加载最近记录
  loadRecentRecords: function() {
    const records = wx.getStorageSync('localRecords') || []
    const sleepRecords = records
      .filter(r => r.type === 'sleep')
      .slice(0, 5)
      .map(r => ({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        relativeTime: util.getRelativeTime(r.createdAt),
        detail: this.getRecordDetail(r)
      }))
    this.setData({ recentRecords: sleepRecords })
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    if (record.wakeTime) {
      const duration = util.calculateDuration(record.sleepTime, record.wakeTime)
      return `睡眠 ${util.formatDuration(duration)}`
    }
    return '入睡中...'
  },

  // 切换睡眠状态
  toggleSleepStatus: function(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ sleepStatus: status })
  },

  // 修改入睡时间
  bindSleepTimeChange: function(e) {
    this.setData({ sleepTime: e.detail.value })
    this.updateDuration()
  },

  // 修改入睡日期
  bindSleepDateChange: function(e) {
    this.setData({ sleepDate: e.detail.value })
    this.updateDuration()
  },

  // 修改醒来时间
  bindWakeTimeChange: function(e) {
    this.setData({ wakeTime: e.detail.value })
    this.updateDuration()
  },

  // 修改醒来日期
  bindWakeDateChange: function(e) {
    this.setData({ wakeDate: e.detail.value })
    this.updateDuration()
  },

  // 更新预计时长
  updateDuration: function() {
    const { sleepDate, sleepTime, wakeDate, wakeTime } = this.data
    
    if (!sleepDate || !sleepTime || !wakeDate || !wakeTime) {
      this.setData({ durationText: '选择时间后自动计算' })
      return
    }

    const sleepDateTime = `${sleepDate} ${sleepTime}:00`
    const wakeDateTime = `${wakeDate} ${wakeTime}:00`
    
    const duration = util.calculateDuration(sleepDateTime, wakeDateTime)
    
    if (duration <= 0) {
      this.setData({ durationText: '醒来时间不能早于入睡时间' })
    } else {
      this.setData({ durationText: util.formatDuration(duration) })
    }
  },

  // 输入备注
  inputNote: function(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交记录
  submitRecord: function() {
    const { sleepStatus, sleepDate, sleepTime, wakeDate, wakeTime, note } = this.data
    
    const record = {
      type: 'sleep',
      sleepTime: `${sleepDate} ${sleepTime}:00`,
      createdAt: `${sleepDate} ${sleepTime}:00`,
      note: note
    }

    if (sleepStatus === 'wokeup') {
      record.wakeTime = `${wakeDate} ${wakeTime}:00`
      
      // 验证时长
      const duration = util.calculateDuration(record.sleepTime, record.wakeTime)
      if (duration <= 0) {
        wx.showToast({
          title: '醒来时间不能早于入睡时间',
          icon: 'none'
        })
        return
      }
    }

    app.saveRecord(record, (result) => {
      if (result.success) {
        wx.showToast({
          title: '记录成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
            fail: function() {
              wx.switchTab({ url: '/pages/index/index' })
            }
          })
        }, 1500)
      }
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
              that.loadRecentRecords()
              wx.showToast({
                title: '已删除',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  }
})
