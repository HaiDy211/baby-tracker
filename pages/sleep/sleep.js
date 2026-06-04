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
    recentRecords: [],
    // 编辑状态
    isEditing: false,
    editingRecordId: ''
  },

  onLoad: function(options) {
    if (options.type === 'wakeup') {
      this.setData({ sleepStatus: 'wokeup' })
    }
    
    this.initTime()
    this.loadRecentRecords()

    if (options.recordId) {
      this.loadRecordForEdit(options.recordId)
    }
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

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    const records = wx.getStorageSync('localRecords') || []
    const record = records.find(r => r.id === recordId)
    if (!record || record.type !== 'sleep') return

    const sleepDateTime = record.sleepTime ? record.sleepTime.split(' ') : record.createdAt.split(' ')
    const sleepDate = sleepDateTime[0]
    const sleepTime = sleepDateTime[1] ? sleepDateTime[1].substring(0, 5) : '00:00'

    let wakeDate = sleepDate, wakeTime = sleepTime, sleepStatus = 'sleeping'
    
    if (record.wakeTime) {
      const wakeDateTime = record.wakeTime.split(' ')
      wakeDate = wakeDateTime[0]
      wakeTime = wakeDateTime[1].substring(0, 5)
      sleepStatus = 'wokeup'
    }

    this.setData({
      isEditing: true,
      editingRecordId: recordId,
      sleepStatus: sleepStatus,
      sleepDate: sleepDate,
      sleepTime: sleepTime,
      wakeDate: wakeDate,
      wakeTime: wakeTime,
      note: record.note || ''
    })
    this.updateDuration()
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
    const { sleepStatus, sleepDate, sleepTime, wakeDate, wakeTime, note, isEditing, editingRecordId } = this.data
    
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

    const saveCallback = (result) => {
      if (result.success) {
        wx.showToast({
          title: isEditing ? '已更新' : '记录成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          this.resetForm()
          this.loadRecentRecords()
        }, 1000)
      }
    }

    if (isEditing && editingRecordId) {
      app.updateRecord(editingRecordId, record, saveCallback)
    } else {
      app.saveRecord(record, saveCallback)
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
  },

  // 删除当前编辑的记录
  deleteEditingRecord: function() {
    if (!this.data.editingRecordId) return
    
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#FF6B8A',
      success: function(res) {
        if (res.confirm) {
          app.deleteRecord(that.data.editingRecordId, function(result) {
            if (result.success) {
              that.resetForm()
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
  },

  // 取消编辑
  cancelEdit: function() {
    this.resetForm()
  },

  // 重置表单
  resetForm: function() {
    this.setData({
      isEditing: false,
      editingRecordId: '',
      sleepStatus: 'sleeping',
      note: ''
    })
    this.initTime()
  }
})
