// 我的页面 - 家庭和宝宝信息设置
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 用户信息
    userInfo: null,
    // 家庭信息
    familyInfo: null,
    // 当前宝宝信息
    currentBaby: null,
    // 宝宝列表
    babies: [],
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
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  // 加载数据
  loadData: function() {
    const userInfo = app.globalData.userInfo
    const familyInfo = app.globalData.familyInfo
    const currentBaby = app.globalData.currentBaby

    this.setData({
      userInfo,
      familyInfo,
      currentBaby,
      babies: familyInfo ? familyInfo.babies : []
    })

    // 加载统计数据
    this.loadStats()
  },

  // 加载统计数据
  loadStats: function() {
    if (!app.globalData.familyInfo) return

    app.getRecords({ limit: 1000 }).then(records => {
      const stats = {
        totalRecords: records.length,
        totalFeed: records.filter(r => r.type === 'feed').length,
        totalDiaper: records.filter(r => r.type === 'diaper').length,
        totalSleep: records.filter(r => r.type === 'sleep').length,
        totalGrowth: records.filter(r => r.type === 'growth').length
      }
      this.setData({ stats })
    }).catch(err => {
      console.error('加载统计失败', err)
    })
  },

  // 跳转到家庭管理
  goToFamily: function() {
    wx.navigateTo({
      url: '/pages/family/family'
    })
  },

  // 跳转到家庭设置
  goToFamilySettings: function() {
    wx.navigateTo({
      url: '/pages/family-settings/family-settings'
    })
  },

  // 跳转到宝宝管理
  goToBabies: function() {
    wx.navigateTo({
      url: '/pages/babies/babies'
    })
  },

  // 退出登录
  onLogout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          app.clearLoginInfo()
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  // 关于页面
  showAbout: function() {
    wx.showModal({
      title: '关于宝宝成长记录',
      content: '一款温馨的宝宝日常记录小程序，帮助爸爸妈妈记录宝宝的成长点滴。\n\n支持家庭共享，多人协同记录宝宝成长。\n\n版本：2.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
