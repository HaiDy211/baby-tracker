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
    familyInfo: null,
    userInfo: null,
    titleOptions: TITLE_OPTIONS,
    isOwner: false
  },

  onLoad: function() {
    this.loadData()
  },

  onShow: function() {
    this.loadData()
  },

  loadData: function() {
    const familyInfo = app.globalData.familyInfo
    const userInfo = app.globalData.userInfo

    this.setData({
      familyInfo,
      userInfo,
      isOwner: familyInfo && userInfo && familyInfo.ownerId === userInfo.openid
    })
  },

  // 复制邀请码
  onCopyInviteCode: function() {
    if (!this.data.familyInfo) return

    wx.setClipboardData({
      data: this.data.familyInfo.inviteCode,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        })
      }
    })
  },

  // 修改称呼
  onChangeTitle: function() {
    const currentMember = this.data.familyInfo.members.find(
      m => m.userId === this.data.userInfo.openid
    )

    wx.showActionSheet({
      itemList: TITLE_OPTIONS.map(t => t.label),
      success: res => {
        const newTitle = TITLE_OPTIONS[res.tapIndex].value
        app.updateMemberTitle(newTitle).then(() => {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
        }).catch(err => {
          wx.showToast({
            title: err.message || '修改失败',
            icon: 'none'
          })
        })
      }
    })
  },

  // 退出家庭
  onLeaveFamily: function() {
    if (this.data.isOwner) {
      wx.showModal({
        title: '提示',
        content: '您是家庭管理员，退出后将解散家庭。确定要退出吗？',
        success: res => {
          if (res.confirm) {
            wx.showModal({
              title: '确认解散',
              content: '此操作不可恢复，所有家庭数据将被删除！',
              success: modalRes => {
                if (modalRes.confirm) {
                  app.deleteFamily().then(() => {
                    wx.showToast({
                      title: '已解散家庭',
                      icon: 'success'
                    })
                    setTimeout(() => {
                      wx.redirectTo({
                        url: '/pages/family/family'
                      })
                    }, 1500)
                  }).catch(err => {
                    wx.showToast({
                      title: err.message || '操作失败',
                      icon: 'none'
                    })
                  })
                }
              }
            })
          }
        }
      })
    } else {
      wx.showModal({
        title: '确认退出',
        content: '确定要退出该家庭吗？',
        success: res => {
          if (res.confirm) {
            app.leaveFamily().then(() => {
              wx.showToast({
                title: '已退出家庭',
                icon: 'success'
              })
              setTimeout(() => {
                wx.redirectTo({
                  url: '/pages/family/family'
                })
              }, 1500)
            }).catch(err => {
              wx.showToast({
                title: err.message || '操作失败',
                icon: 'none'
              })
            })
          }
        }
      })
    }
  },

  // 跳转到宝宝管理
  onGoToBabies: function() {
    wx.navigateTo({
      url: '/pages/babies/babies'
    })
  }
})
