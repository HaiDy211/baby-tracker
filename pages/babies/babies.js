const app = getApp()

Page({
  data: {
    babies: [],
    currentBaby: null,
    isFirst: false
  },

  onLoad: function(options) {
    if (options.first === 'true') {
      this.setData({ isFirst: true })
      wx.setNavigationBarTitle({ title: '添加宝宝' })
    }
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    const familyInfo = app.globalData.familyInfo
    if (familyInfo) {
      this.setData({
        babies: familyInfo.babies || [],
        currentBaby: app.globalData.currentBaby
      })
    }
  },

  // 添加宝宝
  onAddBaby: function() {
    wx.navigateTo({
      url: '/pages/baby-edit/baby-edit'
    })
  },

  // 编辑宝宝
  onEditBaby: function(e) {
    const babyId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/baby-edit/baby-edit?id=${babyId}`
    })
  },

  // 切换当前宝宝
  onSelectBaby: function(e) {
    const babyId = e.currentTarget.dataset.id
    app.switchBaby(babyId)
    this.loadData()
    wx.showToast({
      title: '已切换',
      icon: 'success'
    })
  },

  // 删除宝宝
  onDeleteBaby: function(e) {
    const baby = e.currentTarget.dataset.baby
    const babyId = baby.babyId

    wx.showModal({
      title: '确认删除',
      content: `确定要删除宝宝"${baby.name}"吗？所有相关记录也将被删除！`,
      success: res => {
        if (res.confirm) {
          app.deleteBaby(babyId).then(() => {
            wx.showToast({
              title: '已删除',
              icon: 'success'
            })
          }).catch(err => {
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 完成添加（首次添加后）
  onComplete: function() {
    if (this.data.isFirst) {
      wx.redirectTo({
        url: '/pages/family-settings/family-settings'
      })
    }
  }
})
