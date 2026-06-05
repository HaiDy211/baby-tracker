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
    // 编辑状态
    isEditing: false,
    editingRecordId: ''
  },

  onLoad: function(options) {
    this.initTime()

    // 如果有 recordId 参数，说明是从记录列表进入编辑的
    if (options.recordId) {
      this.loadRecordForEdit(options.recordId)
    }
  },

  // 初始化时间
  initTime: function() {
    const now = new Date()
    this.setData({
      recordTime: util.formatTimeShort(now),
      recordDate: util.formatDate(now)
    })
  },

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    app.getRecords({ type: 'diaper', limit: 100 }).then(records => {
      const record = records.find(r => r._id === recordId)
      if (!record) return

      const dateTime = record._createTime ? new Date(record._createTime) : new Date()
      const date = util.formatDate(dateTime)
      const time = util.formatTimeShort(dateTime)

      this.setData({
        isEditing: true,
        editingRecordId: recordId,
        wet: record.data ? record.data.wet : record.wet || false,
        dirty: record.data ? record.data.dirty : record.dirty || false,
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
    const parts = []
    if (data.wet) parts.push('湿')
    if (data.dirty) parts.push('脏')
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

    // 检查是否已登录且有家庭
    if (!app.globalData.familyInfo || !app.globalData.currentBaby) {
      wx.showToast({
        title: '请先加入家庭并添加宝宝',
        icon: 'none'
      })
      return
    }

    const record = {
      type: 'diaper',
      createdAt: `${recordDate} ${recordTime}:00`,
      data: {
        wet: wet,
        dirty: dirty,
        note: note
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
      wet: true,
      dirty: false,
      note: ''
    })
    this.initTime()
  }
})
