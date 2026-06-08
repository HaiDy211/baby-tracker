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
    // 宝宝相关
    babyList: [],
    selectedBabyIndex: 0,
    selectedBabyName: '',
    selectedBabyId: '',
    // 喂养方式选项
    methodOptions: [
      { value: 'breast-left', label: '左侧母乳' },
      { value: 'breast-right', label: '右侧母乳' },
      { value: 'breast-both', label: '双侧母乳' },
      { value: 'bottle', label: '奶瓶喂养' }
    ],
    // 编辑状态
    isEditing: false,
    editingRecordId: '',
    // 记录列表
    recentRecords: []
  },

  onLoad: function(options) {
    this.initTime()
    this.loadBabyList()

    // 如果有 recordId 参数，说明是从记录列表进入编辑的
    if (options.recordId) {
      this.loadRecordForEdit(options.recordId)
    }
  },

  onShow: function() {
    this.loadBabyList()
    this.loadRecentRecords()
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
    this.setData({
      recordTime: util.formatTimeShort(now),
      recordDate: util.formatDate(now)
    })
  },

  // 加载最近记录
  loadRecentRecords: function() {
    if (!app.globalData.familyInfo) return

    app.getRecords({ type: 'feed', limit: 10 }).then(records => {
      const feedRecords = records.map(r => ({
        ...r,
        icon: util.getRecordTypeIcon(r.type),
        relativeTime: util.getRelativeTime(r._createTime),
        detail: this.getRecordDetail(r),
        createdDate: util.formatDate(new Date(r._createTime))
      }))
      this.setData({ recentRecords: feedRecords })
    }).catch(err => {
      console.error('加载记录失败', err)
    })
  },

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    app.getRecords({ type: 'feed', limit: 100 }).then(records => {
      const record = records.find(r => r._id === recordId)
      if (!record) return

      const dateTime = record._createTime ? new Date(record._createTime) : new Date()
      const date = util.formatDate(dateTime)
      const time = util.formatTimeShort(dateTime)

      this.setData({
        isEditing: true,
        editingRecordId: recordId,
        feedMethod: record.data ? record.data.method : record.method || 'breast-left',
        bottleAmount: record.data ? record.data.amount : record.amount || 120,
        recordDate: date,
        recordTime: time,
        note: record.data ? record.data.note : record.note || ''
      })
    }).catch(err => {
      console.error('加载记录失败', err)
    })
  },

  // 获取记录详情
  getRecordDetail: function(record) {
    const data = record.data || record
    if (data.method === 'bottle') {
      return `${data.amount || 0}ml`
    } else {
      const sides = {
        'breast-left': '左侧',
        'breast-right': '右侧',
        'breast-both': '双侧'
      }
      return sides[data.method] || '母乳'
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

    // 检查是否已登录且有家庭
    if (!app.globalData.familyInfo) {
      wx.showToast({
        title: '请先加入家庭',
        icon: 'none'
      })
      return
    }

    if (!app.globalData.currentBaby) {
      wx.showToast({
        title: '请先添加宝宝',
        icon: 'none'
      })
      return
    }

    const record = {
      type: 'feed',
      createdAt: `${recordDate} ${recordTime}:00`,
      data: {
        method: feedMethod,
        note: note
      }
    }

    if (feedMethod === 'bottle') {
      record.data.amount = parseInt(bottleAmount)
    }

    const saveCallback = (result) => {
      if (result.success) {
        wx.showToast({
          title: isEditing ? '已更新' : '记录成功',
          icon: 'success'
        })
        
        // 延迟返回
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

    // 判断是新增还是更新
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
      feedMethod: 'breast-left',
      bottleAmount: 120,
      note: ''
    })
    this.initTime()
  }
})
