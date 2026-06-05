const app = getApp()

// 称呼选项
const TITLE_OPTIONS = [
  { label: '爸爸', value: '爸爸' },
  { label: '妈妈', value: '妈妈' },
  { label: '爷爷', value: '爷爷' },
  { label: '奶奶', value: '奶奶' },
  { label: '外公', value: '外公' },
  { label: '外婆', value: '外婆' },
  { label: '阿姨', value: '阿姨' },
  { label: '其他', value: '其他' }
]

Page({
  data: {
    // 模式：create-创建, join-加入
    mode: 'create',
    // 创建家庭
    familyName: '',
    // 加入家庭
    inviteCode: '',
    selectedTitle: '爸爸',
    titleOptions: TITLE_OPTIONS,
    // 加载状态
    isLoading: false
  },

  onLoad: function() {
    // 检查是否已加入家庭
    if (app.globalData.familyInfo) {
      wx.showModal({
        title: '提示',
        content: '您已加入家庭，是否前往家庭设置？',
        success: res => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/family-settings/family-settings'
            })
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }
        }
      })
    }
  },

  // 切换模式
  switchMode: function(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode })
  },

  // 设置家庭名称
  onFamilyNameInput: function(e) {
    this.setData({ familyName: e.detail.value })
  },

  // 设置邀请码
  onInviteCodeInput: function(e) {
    this.setData({ inviteCode: e.detail.value.toUpperCase() })
  },

  // 选择称呼
  onTitleChange: function(e) {
    const index = e.detail.value
    this.setData({
      selectedTitle: this.data.titleOptions[index].value
    })
  },

  // 创建家庭
  onCreateFamily: function() {
    const { familyName } = this.data

    if (!familyName.trim()) {
      wx.showToast({
        title: '请输入家庭名称',
        icon: 'none'
      })
      return
    }

    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    app.createFamily(familyName.trim()).then(() => {
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })
      // 跳转到宝宝管理添加宝宝
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/babies/babies?first=true'
        })
      }, 1500)
    }).catch(err => {
      wx.showToast({
        title: err.message || '创建失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  },

  // 加入家庭
  onJoinFamily: function() {
    const { inviteCode, selectedTitle } = this.data

    if (!inviteCode.trim() || inviteCode.length !== 6) {
      wx.showToast({
        title: '请输入6位邀请码',
        icon: 'none'
      })
      return
    }

    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    app.joinFamily(inviteCode.trim(), selectedTitle).then(() => {
      wx.showToast({
        title: '加入成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    }).catch(err => {
      wx.showToast({
        title: err.message || '加入失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  }
})
