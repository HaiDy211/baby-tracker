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
    // 宝宝相关
    babyList: [],
    selectedBabyIndex: 0,
    selectedBabyName: '',
    selectedBabyId: '',
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
    this.loadBabyList()

    if (options.recordId) {
      this.loadRecordForEdit(options.recordId)
    }
  },

  onShow: function() {
    this.loadBabyList()
    this.updateDuration()
  },

  // 加载宝宝列表
  loadBabyList: function() {
    const babyList = app.globalData.babyList || []
    const currentBabyId = app.globalData.currentBabyId || ''
    
    let selectedBabyIndex = 0
    if (currentBabyId) {
      selectedBabyIndex = babyList.findIndex(b => b.babyId === currentBabyId)
      if (selectedBabyIndex === -1) selectedBabyIndex = 0
    }
    
    this.setData({
      babyList: babyList,
      selectedBabyIndex: selectedBabyIndex,
      selectedBabyName: babyList[selectedBabyIndex]?.name || '',
      selectedBabyId: babyList[selectedBabyIndex]?.babyId || ''
    })
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

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    app.getRecords({ type: 'sleep', limit: 100 }).then(records => {
      const record = records.find(r => r._id === recordId)
      if (!record) return

      const data = record.data || record
      const sleepDateTime = data.sleepTime ? new Date(data.sleepTime) : new Date(record._createTime)
      const sleepDate = util.formatDate(sleepDateTime)
      const sleepTime = util.formatTimeShort(sleepDateTime)

      let wakeDate = sleepDate, wakeTime = sleepTime, sleepStatus = 'sleeping'
      
      if (data.wakeTime) {
        const wakeDateTime = new Date(data.wakeTime)
        wakeDate = util.formatDate(wakeDateTime)
        wakeTime = util.formatTimeShort(wakeDateTime)
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
        note: data.note || ''
      })
      this.updateDuration()
    }).catch(err => {
      console.error('加载记录失败', err)
    })
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    const data = record.data || record
    if (data.wakeTime) {
      const duration = util.calculateDuration(data.sleepTime, data.wakeTime)
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

    // 检查是否已登录且有家庭
    if (!app.globalData.familyInfo || !app.globalData.currentBaby) {
      wx.showToast({
        title: '请先加入家庭并添加宝宝',
        icon: 'none'
      })
      return
    }
    
    const record = {
      type: 'sleep',
      createdAt: `${sleepDate} ${sleepTime}:00`,
      data: {
        sleepTime: `${sleepDate} ${sleepTime}:00`,
        note: note
      }
    }

    if (sleepStatus === 'wokeup') {
      record.data.wakeTime = `${wakeDate} ${wakeTime}:00`
      
      // 验证时长
      const duration = util.calculateDuration(record.data.sleepTime, record.data.wakeTime)
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
          wx.navigateBack({
            delta: 1,
            fail: function() {
              wx.switchTab({ url: '/pages/timeline/timeline' })
            }
          })
        }, 1000)
      } else {
        wx.showToast({
          title: result.error || '保存失败',
          icon: 'none'
        })
      }
    }

    if (isEditing && editingRecordId) {
      app.updateRecord(editingRecordId, record, saveCallback)
    } else {
      app.saveRecord(record, saveCallback)
    }
  },

  // 删除当前编辑的记录
  deleteEditingRecord: function() {
    if (!this.data.editingRecordId) return
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: res => {
        if (res.confirm) {
          app.deleteRecord(this.data.editingRecordId, result => {
            if (result.success) {
              wx.showToast({
                title: '已删除',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack({
                  delta: 1,
                  fail: function() {
                    wx.switchTab({ url: '/pages/timeline/timeline' })
                  }
                })
              }, 1000)
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
