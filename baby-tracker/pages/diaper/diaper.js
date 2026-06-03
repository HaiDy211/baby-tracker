// 换尿布记录页面
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 尿布状态
    wet: true,    // 湿
    dirty: false,  // 脏
    // 记录时间
    recordTime: '',
    recordDate: '',
    // 备注
    note: '',
    // 最近记录
    recentRecords: []
  },

  onLoad: function() {
    this.initTime()
    this.loadRecentRecords()
  },

  onShow: function() {
    this.loadRecentRecords()
  },

  // 初始化时间
  initTime: function() {
    const now = new Date()
    this.setData({
      recordTime: util.formatTimeShort(now),
      recordDate: util.formatDate(now)
    })
  },

  // 加载最近记录
  loadRecentRecords: function() {
    const records = wx.getStorageSync('localRecords') || []
    const diaperRecords = records
      .filter(r => r.type === 'diaper')
      .slice(0, 5)
      .map(r => ({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        relativeTime: util.getRelativeTime(r.createdAt),
        detail: this.getRecordDetail(r)
      }))
    this.setData({ recentRecords: diaperRecords })
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    const parts = []
    if (record.wet) parts.push('湿')
    if (record.dirty) parts.push('脏')
    return parts.length > 0 ? parts.join('+') : '换尿布'
  },

  // 切换湿尿布
  toggleWet: function() {
    this.setData({ wet: !this.data.wet })
  },

  // 切换脏尿布
  toggleDirty: function() {
    this.setData({ dirty: !this.data.dirty })
  },

  // 修改时间
  bindTimeChange: function(e) {
    this.setData({ recordTime: e.detail.value })
  },

  // 修改日期
  bindDateChange: function(e) {
    this.setData({ recordDate: e.detail.value })
  },

  // 输入备注
  inputNote: function(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交记录
  submitRecord: function() {
    const { wet, dirty, recordTime, recordDate, note } = this.data
    
    // 至少选择一种状态
    if (!wet && !dirty) {
      wx.showToast({
        title: '请选择尿布状态',
        icon: 'none'
      })
      return
    }

    const record = {
      type: 'diaper',
      wet: wet,
      dirty: dirty,
      sleepTime: `${recordDate} ${recordTime}:00`,
      createdAt: `${recordDate} ${recordTime}:00`,
      note: note
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
