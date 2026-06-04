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
    recentRecords: [],
    // 编辑状态
    isEditing: false,
    editingRecordId: ''
  },

  onLoad: function() {
    this.initTime()
    this.loadRecentRecords()

    if (getApp().globalData) {
      const app = getApp()
      if (app.globalData.editRecordId) {
        this.loadRecordForEdit(app.globalData.editRecordId)
        app.globalData.editRecordId = null
      }
    }
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

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    const records = wx.getStorageSync('localRecords') || []
    const record = records.find(r => r.id === recordId)
    if (!record || record.type !== 'diaper') return

    const dateTime = record.createdAt.split(' ')
    const date = dateTime[0]
    const time = dateTime[1] ? dateTime[1].substring(0, 5) : '00:00'

    this.setData({
      isEditing: true,
      editingRecordId: recordId,
      wet: record.wet || false,
      dirty: record.dirty || false,
      recordDate: date,
      recordTime: time,
      note: record.note || ''
    })
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
    const { wet, dirty, recordTime, recordDate, note, isEditing, editingRecordId } = this.data
    
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
      wet: true,
      dirty: false,
      note: ''
    })
    this.initTime()
  }
})
