const app = getApp()

Page({
  data: {
    isLoading: false
  },

  onLoad: function(options) {
    // 检查是否已登录且已加入家庭
    this.checkStatus()
  },

  onShow: function() {
    this.checkStatus()
  },

  // 检查登录和家庭状态
  checkStatus: function() {
    const isLoggedIn = app.globalData.isLoggedIn
    const hasFamily = !!app.globalData.familyInfo

    if (isLoggedIn && hasFamily) {
      // 已登录且有家庭，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      })
    } else if (isLoggedIn && !hasFamily) {
      // 已登录但没有家庭，跳转到家庭管理
      wx.redirectTo({
        url: '/pages/family/family'
      })
    }
  },

  // 微信登录
  onLogin: function(e) {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    app.login().then(userInfo => {
      console.log('登录成功', userInfo)
      // 保存登录信息
      app.saveLoginInfo()
      // 加载家庭信息
      return app.loadFamilyInfo()
    }).then(() => {
      if (app.globalData.familyInfo) {
        // 有家庭，跳转首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      } else {
        // 没有家庭，跳转家庭管理
        wx.redirectTo({
          url: '/pages/family/family'
        })
      }
    }).catch(err => {
      console.error('登录失败', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  }
})
