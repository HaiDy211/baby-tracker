const app = getApp()

Page({
  data: {
    isLoading: false,
    nickname: '',
    step: 1 // 1: 登录 2: 设置昵称
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
      // 进入设置昵称步骤
      this.setData({ 
        isLoading: false, 
        step: 2,
        nickname: userInfo.nickname
      })
    }).catch(err => {
      console.error('登录失败', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    })
  },

  // 设置昵称
  onSetNickname: function(e) {
    const nickname = this.data.nickname.trim()
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    this.setData({ isLoading: true })

    app.updateUserInfo(nickname).then(() => {
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
      console.error('设置昵称失败', err)
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  },

  // 昵称输入
  onNicknameInput: function(e) {
    var value = e.detail.value
    if (value !== undefined && value !== null) {
      this.setData({
        nickname: value
      })
    }
  }
})
