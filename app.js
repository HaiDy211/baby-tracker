// app.js
const db = require('./utils/db.js')
const util = require('./utils/util.js')

App({
  globalData: {
    envId: 'cloudbase-d0g4zhfbpbd2b7a16', // 云开发环境ID，需要手动配置
    userInfo: null,       // 用户信息
    familyInfo: null,      // 家庭信息
    babyList: [],          // 宝宝列表
    currentBaby: null,     // 当前选择的宝宝
    currentBabyId: '',     // 当前宝宝ID
    isLoggedIn: false,     // 是否已登录
    isInitialized: false   // 是否已初始化完成
  },

  onLaunch: function() {
    if (!this.globalData.envId) {
      console.log('未配置云开发环境ID，无法使用云端功能')
      wx.showModal({
        title: '提示',
        content: '请在 app.js 中配置云开发环境ID，或联系开发者配置',
        showCancel: false
      })
      return
    }

    // 初始化云开发
    this.initCloud()
  },

  // 初始化云开发
  initCloud: function() {
    if (!this.globalData.envId) return

    try {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true,
      })
      console.log('云开发初始化成功')
    } catch (e) {
      console.error('云开发初始化失败', e)
      wx.showModal({
        title: '错误',
        content: '云开发初始化失败，请检查配置',
        showCancel: false
      })
    }
  },

  // 微信登录
  login: function() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (res.code) {
            // 获取 openid
            wx.cloud.callFunction({
              name: 'login',
              data: { code: res.code }
            }).then(loginRes => {
              const openid = loginRes.result.openid
              // 使用默认昵称
              const userInfo = {
                openid: openid,
                nickname: '家庭成员',
                avatarUrl: ''
              }
              // 保存到全局
              this.globalData.userInfo = userInfo
              this.globalData.isLoggedIn = true
              // 保存到云端
              db.getOrCreateUser(userInfo).then(savedUser => {
                this.globalData.userInfo = savedUser
                resolve(savedUser)
              }).catch(err => {
                console.error('保存用户信息失败', err)
                resolve(userInfo)
              })
            }).catch(err => {
              console.error('获取openid失败', err)
              reject(err)
            })
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: err => {
          reject(err)
        }
      })
    })
  },

  // 更新用户信息
  updateUserInfo: function(nickname, avatarUrl) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.userInfo) {
        reject(new Error('用户未登录'))
        return
      }
      
      const userInfo = {
        ...this.globalData.userInfo,
        nickname: nickname || this.globalData.userInfo.nickname,
        avatarUrl: avatarUrl || this.globalData.userInfo.avatarUrl
      }
      
      db.updateUser(userInfo).then(updatedUser => {
        this.globalData.userInfo = updatedUser
        // 保存到本地
        wx.setStorageSync('nickname', updatedUser.nickname)
        wx.setStorageSync('avatarUrl', updatedUser.avatarUrl)
        resolve(updatedUser)
      }).catch(err => {
        console.error('更新用户信息失败', err)
        reject(err)
      })
    })
  },

  // 检查用户是否已登录
  checkLogin: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.isLoggedIn && this.globalData.familyInfo) {
        resolve(true)
        return
      }

      // 检查本地缓存的 openid
      const openid = wx.getStorageSync('openid')
      if (openid) {
        this.globalData.userInfo = {
          openid: openid,
          nickname: wx.getStorageSync('nickname') || '用户',
          avatarUrl: wx.getStorageSync('avatarUrl') || ''
        }
        this.globalData.isLoggedIn = true
        // 加载家庭信息
        this.loadFamilyInfo().then(() => {
          resolve(true)
        }).catch(() => {
          resolve(false)
        })
      } else {
        resolve(false)
      }
    })
  },

  // 加载家庭信息
  loadFamilyInfo: function() {
    return new Promise((resolve, reject) => {
      if (!this.globalData.userInfo) {
        reject(new Error('用户未登录'))
        return
      }

      db.getUserFamily(this.globalData.userInfo.openid).then(family => {
        if (family) {
          this.globalData.familyInfo = family
          // 设置宝宝列表
          this.globalData.babyList = family.babies || []
          // 设置当前宝宝
          const defaultBaby = family.babies.find(b => b.isDefault) || family.babies[0]
          this.globalData.currentBaby = defaultBaby || null
          this.globalData.currentBabyId = defaultBaby?.babyId || ''
        } else {
          this.globalData.familyInfo = null
          this.globalData.babyList = []
          this.globalData.currentBaby = null
          this.globalData.currentBabyId = ''
        }
        resolve(family)
      }).catch(err => {
        console.error('加载家庭信息失败', err)
        reject(err)
      })
    })
  },

  // 创建家庭
  createFamily: function(name) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.userInfo) {
        reject(new Error('用户未登录'))
        return
      }

      db.createFamily(name, {
        userId: this.globalData.userInfo.openid,
        nickname: this.globalData.userInfo.nickname,
        avatarUrl: this.globalData.userInfo.avatarUrl,
        title: '爸爸'
      }).then(res => {
        // 重新加载家庭信息
        return this.loadFamilyInfo()
      }).then(family => {
        resolve(family)
      }).catch(err => {
        console.error('创建家庭失败', err)
        reject(err)
      })
    })
  },

  // 加入家庭
  joinFamily: function(inviteCode, title) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.userInfo) {
        reject(new Error('用户未登录'))
        return
      }

      db.findFamilyByInviteCode(inviteCode).then(family => {
        if (!family) {
          reject(new Error('邀请码无效'))
          return
        }

        // 检查是否已是成员
        const isMember = family.members.some(m => m.userId === this.globalData.userInfo.openid)
        if (isMember) {
          reject(new Error('您已经是该家庭成员'))
          return
        }

        return db.joinFamily(family._id, {
          userId: this.globalData.userInfo.openid,
          nickname: this.globalData.userInfo.nickname,
          avatarUrl: this.globalData.userInfo.avatarUrl,
          title: title
        })
      }).then(() => {
        return this.loadFamilyInfo()
      }).then(family => {
        resolve(family)
      }).catch(err => {
        console.error('加入家庭失败', err)
        reject(err)
      })
    })
  },

  // 更新成员称呼
  updateMemberTitle: function(title) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo || !this.globalData.userInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      db.updateMemberTitle(this.globalData.familyInfo._id, this.globalData.userInfo.openid, title)
        .then(() => {
          return this.loadFamilyInfo()
        })
        .then(family => {
          resolve(family)
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 退出家庭
  leaveFamily: function() {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo || !this.globalData.userInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      db.leaveFamily(this.globalData.familyInfo._id, this.globalData.userInfo.openid)
        .then(() => {
          this.globalData.familyInfo = null
          this.globalData.babyList = []
          this.globalData.currentBaby = null
          this.globalData.currentBabyId = ''
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 解散家庭
  deleteFamily: function() {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo || !this.globalData.userInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      // 只有管理员可以解散
      if (this.globalData.familyInfo.ownerId !== this.globalData.userInfo.openid) {
        reject(new Error('只有家庭管理员可以解散家庭'))
        return
      }

      db.deleteFamily(this.globalData.familyInfo._id)
        .then(() => {
          this.globalData.familyInfo = null
          this.globalData.babyList = []
          this.globalData.currentBaby = null
          this.globalData.currentBabyId = ''
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 添加宝宝
  addBaby: function(babyInfo) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      // 如果是第一个宝宝，设为默认
      if (this.globalData.familyInfo.babies.length === 0) {
        babyInfo.isDefault = true
      }

      db.addBaby(this.globalData.familyInfo._id, babyInfo)
        .then(() => {
          return this.loadFamilyInfo()
        })
        .then(family => {
          // 更新宝宝列表和当前宝宝
          this.globalData.babyList = family.babies || []
          this.globalData.currentBaby = family.babies[family.babies.length - 1]
          this.globalData.currentBabyId = family.babies[family.babies.length - 1]?.babyId || ''
          resolve(family)
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 更新宝宝
  updateBaby: function(babyId, babyInfo) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      db.updateBaby(this.globalData.familyInfo._id, babyId, babyInfo)
        .then(() => {
          return this.loadFamilyInfo()
        })
        .then(family => {
          // 更新宝宝列表和当前宝宝
          this.globalData.babyList = family.babies || []
          if (this.globalData.currentBaby && this.globalData.currentBaby.babyId === babyId) {
            this.globalData.currentBaby = family.babies.find(b => b.babyId === babyId)
          }
          resolve(family)
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 删除宝宝
  deleteBaby: function(babyId) {
    return new Promise((resolve, reject) => {
      if (!this.globalData.familyInfo) {
        reject(new Error('未加入家庭'))
        return
      }

      db.deleteBaby(this.globalData.familyInfo._id, babyId)
        .then(() => {
          return this.loadFamilyInfo()
        })
        .then(family => {
          // 更新宝宝列表
          this.globalData.babyList = family.babies || []
          // 如果删除的是当前宝宝，切换到默认宝宝
          if (this.globalData.currentBaby && this.globalData.currentBaby.babyId === babyId) {
            const newCurrentBaby = family.babies.find(b => b.isDefault) || family.babies[0]
            this.globalData.currentBaby = newCurrentBaby || null
            this.globalData.currentBabyId = newCurrentBaby?.babyId || ''
          }
          resolve(family)
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  // 切换当前宝宝
  switchBaby: function(babyId) {
    if (!this.globalData.familyInfo) return

    const baby = this.globalData.familyInfo.babies.find(b => b.babyId === babyId)
    if (baby) {
      this.globalData.currentBaby = baby
      this.globalData.currentBabyId = babyId
    }
  },

  // 保存记录
  saveRecord: function(record, callback) {
    if (!this.globalData.familyInfo || !this.globalData.currentBaby) {
      if (callback) callback({ success: false, error: '未选择宝宝' })
      return
    }

    // 添加记录人和宝宝信息
    const currentMember = this.globalData.familyInfo.members.find(
      m => m.userId === this.globalData.userInfo.openid
    )

    record.familyId = this.globalData.familyInfo._id
    record.babyId = this.globalData.currentBaby.babyId
    record.userId = this.globalData.userInfo.openid
    record.userTitle = currentMember ? currentMember.title : '未知'

    db.addRecord(record).then(res => {
      if (callback) callback({ success: true, fromCloud: true })
    }).catch(err => {
      console.error('保存记录失败', err)
      if (callback) callback({ success: false, error: err.message })
    })
  },

  // 更新记录
  updateRecord: function(recordId, data, callback) {
    db.updateRecord(recordId, data).then(res => {
      if (callback) callback({ success: true })
    }).catch(err => {
      console.error('更新记录失败', err)
      if (callback) callback({ success: false, error: err.message })
    })
  },

  // 删除记录
  deleteRecord: function(recordId, callback) {
    db.deleteRecord(recordId).then(res => {
      if (callback) callback({ success: true })
    }).catch(err => {
      console.error('删除记录失败', err)
      if (callback) callback({ success: false, error: err.message })
    })
  },

  // 获取记录
  getRecords: function(options = {}) {
    if (!this.globalData.familyInfo) {
      return Promise.reject(new Error('未加入家庭'))
    }

    options.familyId = this.globalData.familyInfo._id

    if (this.globalData.currentBaby) {
      options.babyId = this.globalData.currentBaby.babyId
    }

    return db.getRecords(options)
  },

  // 获取今日统计
  getTodayStats: function() {
    if (!this.globalData.familyInfo) {
      return Promise.reject(new Error('未加入家庭'))
    }

    return db.getTodayStats(
      this.globalData.familyInfo._id,
      this.globalData.currentBaby ? this.globalData.currentBaby.babyId : null
    )
  },

  // 保存登录信息到本地
  saveLoginInfo: function() {
    if (this.globalData.userInfo) {
      wx.setStorageSync('openid', this.globalData.userInfo.openid)
      wx.setStorageSync('nickname', this.globalData.userInfo.nickname)
      wx.setStorageSync('avatarUrl', this.globalData.userInfo.avatarUrl)
    }
  },

  // 清除登录信息
  clearLoginInfo: function() {
    wx.removeStorageSync('openid')
    wx.removeStorageSync('nickname')
    wx.removeStorageSync('avatarUrl')
    this.globalData.userInfo = null
    this.globalData.familyInfo = null
    this.globalData.babyList = []
    this.globalData.currentBaby = null
    this.globalData.currentBabyId = ''
    this.globalData.isLoggedIn = false
  }
})
