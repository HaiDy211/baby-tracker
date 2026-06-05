const app = getApp()

Page({
  data: {
    babyId: '',           // 编辑时使用
    name: '',
    birthDate: '',
    gender: 'unknown',    // boy, girl, unknown
    avatar: '',
    isDefault: false,
    isEdit: false         // 是否编辑模式
  },

  onLoad: function(options) {
    if (options.id) {
      // 编辑模式
      this.setData({
        babyId: options.id,
        isEdit: true
      })
      wx.setNavigationBarTitle({ title: '编辑宝宝' })
      this.loadBaby(options.id)
    }
  },

  loadBaby: function(babyId) {
    const familyInfo = app.globalData.familyInfo
    if (!familyInfo) return

    const baby = familyInfo.babies.find(b => b.babyId === babyId)
    if (baby) {
      this.setData({
        name: baby.name,
        birthDate: baby.birthDate,
        gender: baby.gender || 'unknown',
        avatar: baby.avatar || '',
        isDefault: baby.isDefault
      })
    }
  },

  // 输入宝宝姓名
  onNameInput: function(e) {
    this.setData({ name: e.detail.value })
  },

  // 选择出生日期
  onBirthDateChange: function(e) {
    this.setData({ birthDate: e.detail.value })
  },

  // 选择性别
  onGenderChange: function(e) {
    const genders = ['unknown', 'boy', 'girl']
    this.setData({ gender: genders[e.detail.value] })
  },

  // 设置为默认宝宝
  onDefaultChange: function(e) {
    this.setData({ isDefault: e.detail.value.length > 0 })
  },

  // 选择头像
  onChooseAvatar: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}.jpg`,
          filePath: tempFilePath
        }).then(uploadRes => {
          this.setData({ avatar: uploadRes.fileID })
        }).catch(err => {
          console.error('上传头像失败', err)
          wx.showToast({
            title: '上传头像失败',
            icon: 'none'
          })
        })
      }
    })
  },

  // 保存
  onSave: function() {
    const { name, birthDate, isEdit, babyId } = this.data

    if (!name.trim()) {
      wx.showToast({
        title: '请输入宝宝姓名',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const babyInfo = {
      name: name.trim(),
      birthDate: birthDate,
      gender: this.data.gender,
      avatar: this.data.avatar,
      isDefault: this.data.isDefault
    }

    const promise = isEdit
      ? app.updateBaby(babyId, babyInfo)
      : app.addBaby(babyInfo)

    promise.then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      })
    })
  }
})
