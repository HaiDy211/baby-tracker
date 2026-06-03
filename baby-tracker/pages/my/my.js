// 我的页面 - 宝宝信息设置
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 宝宝信息
    babyName: '',
    birthDate: '',
    gender: 'unknown', // unknown, boy, girl
    // 宝宝年龄
    babyAge: '',
    // 统计数据
    stats: {
      totalRecords: 0,
      totalFeed: 0,
      totalDiaper: 0,
      totalSleep: 0,
      totalGrowth: 0
    },
    // 版本信息
    version: '1.0.0'
  },

  onLoad: function() {
    this.loadBabyInfo()
    this.loadStats()
  },

  onShow: function() {
    this.loadBabyInfo()
    this.loadStats()
  },

  // 加载宝宝信息
  loadBabyInfo: function() {
    const babyInfo = app.globalData.babyInfo || {}
    this.setData({
      babyName: babyInfo.name || '',
      birthDate: babyInfo.birthDate || '',
      gender: babyInfo.gender || 'unknown'
    })
    
    // 计算宝宝年龄
    if (babyInfo.birthDate) {
      this.calculateAge(babyInfo.birthDate)
    }
  },

  // 计算宝宝年龄
  calculateAge: function(birthDate) {
    if (!birthDate) {
      this.setData({ babyAge: '' })
      return
    }
    
    const birth = new Date(birthDate)
    const now = new Date()
    
    const diffMs = now - birth
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.floor(diffDays / 30)
    const years = Math.floor(months / 12)
    
    let ageText = ''
    if (years > 0) {
      ageText += `${years}岁`
    }
    if (months % 12 > 0) {
      ageText += `${months % 12}个月`
    }
    if (!ageText && diffDays >= 0) {
      ageText = `${diffDays}天`
    }
    
    this.setData({ babyAge: ageText || '未设置出生日期' })
  },

  // 加载统计数据
  loadStats: function() {
    const records = wx.getStorageSync('localRecords') || []
    
    const stats = {
      totalRecords: records.length,
      totalFeed: records.filter(r => r.type === 'feed').length,
      totalDiaper: records.filter(r => r.type === 'diaper').length,
      totalSleep: records.filter(r => r.type === 'sleep').length,
      totalGrowth: records.filter(r => r.type === 'growth').length
    }
    
    this.setData({ stats })
  },

  // 输入宝宝姓名
  inputName: function(e) {
    this.setData({ babyName: e.detail.value })
  },

  // 选择出生日期
  bindDateChange: function(e) {
    const date = e.detail.value
    this.setData({ birthDate: date })
    this.calculateAge(date)
  },

  // 选择性别
  selectGender: function(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
  },

  // 保存宝宝信息
  saveBabyInfo: function() {
    const { babyName, birthDate, gender } = this.data
    
    const babyInfo = {
      name: babyName || '小宝宝',
      birthDate: birthDate,
      gender: gender
    }
    
    app.updateBabyInfo(babyInfo)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  // 清除所有数据
  clearAllData: function() {
    const that = this
    
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有记录数据吗？此操作不可恢复！',
      confirmColor: '#FF6B8A',
      success: function(res) {
        if (res.confirm) {
          wx.showModal({
            title: '再次确认',
            content: '所有记录将被永久删除！',
            confirmColor: '#FF6B8A',
            success: function(res2) {
              if (res2.confirm) {
                wx.clearStorageSync()
                that.loadStats()
                wx.showToast({
                  title: '已清除',
                  icon: 'success'
                })
              }
            }
          })
        }
      }
    })
  },

  // 关于页面
  showAbout: function() {
    wx.showModal({
      title: '关于宝宝成长记录',
      content: '一款温馨的宝宝日常记录小程序，帮助爸爸妈妈记录宝宝的成长点滴。\n\n版本：1.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
