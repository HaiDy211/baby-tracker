// 喂奶记录页面
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 喂奶方式: breast-left, breast-right, breast-both, bottle
    feedMethod: 'breast-left',
    // 奶瓶容量(ml)
    bottleAmount: 120,
    // 记录时间
    recordTime: '',
    recordDate: '',
    // 备注
    note: '',
    // 喂养方式选项
    methodOptions: [
      { value: 'breast-left', label: '左侧母乳', icon: '🤱' },
      { value: 'breast-right', label: '右侧母乳', icon: '🤱' },
      { value: 'breast-both', label: '双侧母乳', icon: '🤱' },
      { value: 'bottle', label: '奶瓶喂养', icon: '🍼' }
    ],
    // 最近记录
    recentRecords: [],
    // 编辑状态
    isEditing: false,
    editingRecordId: ''
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
    const feedRecords = records
      .filter(r => r.type === 'feed')
      .slice(0, 5)
      .map(r => ({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        relativeTime: util.getRelativeTime(r.createdAt),
        detail: this.getRecordDetail(r)
      }))
    this.setData({ recentRecords: feedRecords })
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    if (record.method === 'bottle') {
      return `${record.amount || 0}ml`
    } else {
      const sides = {
        'breast-left': '左侧',
        'breast-right': '右侧',
        'breast-both': '双侧'
      }
      return sides[record.method] || '母乳'
    }
  },

  // 选择喂奶方式
  selectMethod: function(e) {
    const method = e.currentTarget.dataset.method
    this.setData({ feedMethod: method })
  },

  // 输入奶瓶容量
  inputAmount: function(e) {
    this.setData({ bottleAmount: e.detail.value })
  },

  // 增加容量
  addAmount: function() {
    const current = parseInt(this.data.bottleAmount) || 0
    this.setData({ bottleAmount: current + 30 })
  },

  // 减少容量
  reduceAmount: function() {
    const current = parseInt(this.data.bottleAmount) || 0
    if (current > 30) {
      this.setData({ bottleAmount: current - 30 })
    }
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
    const { feedMethod, bottleAmount, recordTime, recordDate, note, isEditing, editingRecordId } = this.data
    
    // 验证
    if (feedMethod === 'bottle' && (!bottleAmount || bottleAmount <= 0)) {
      wx.showToast({
        title: '请输入奶量',
        icon: 'none'
      })
      return
    }

    const record = {
      type: 'feed',
      method: feedMethod,
      sleepTime: `${recordDate} ${recordTime}:00`,
      createdAt: `${recordDate} ${recordTime}:00`,
      note: note
    }

    if (feedMethod === 'bottle') {
      record.amount = parseInt(bottleAmount)
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

    // 判断是新增还是更新
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

  // 点击记录编辑
  onTapRecord: function(e) {
    const recordId = e.currentTarget.dataset.id
    console.log('点击记录:', recordId)
    
    if (!recordId) {
      wx.showToast({ title: '记录ID无效', icon: 'none' })
      return
    }
    
    const record = this.data.recentRecords.find(r => r.id === recordId)
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' })
      return
    }

    // 解析日期和时间
    const dateTime = record.createdAt.split(' ')
    const date = dateTime[0]
    const time = dateTime[1] ? dateTime[1].substring(0, 5) : '00:00'

    this.setData({
      isEditing: true,
      editingRecordId: recordId,
      feedMethod: record.method || 'breast-left',
      bottleAmount: record.amount || 120,
      recordDate: date,
      recordTime: time,
      note: record.note || ''
    })
    
    wx.showToast({ title: '已加载记录，可编辑', icon: 'none', duration: 1000 })
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
      feedMethod: 'breast-left',
      bottleAmount: 120,
      note: ''
    })
    this.initTime()
  }
})
