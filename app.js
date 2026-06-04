// 小程序入口文件
const util = require('./utils/util.js')
const db = require('./utils/db.js')

App({
  // 全局数据
  globalData: {
    userInfo: null,
    babyInfo: null,
    envId: '', // 云开发环境ID，由用户填写
  },

  onLaunch: function () {
    // 加载本地缓存的宝宝信息
    this.loadBabyInfo()
    
    // 加载本地缓存的记录
    this.loadLocalRecords()
    
    // 初始化云开发（延迟执行，避免阻塞）
    if (this.globalData.envId) {
      try {
        wx.cloud.init({
          env: this.globalData.envId,
          traceUser: true,
        })
      } catch (e) {
        console.log('云开发初始化失败，使用本地存储', e)
      }
    } else {
      console.log('未配置云开发环境ID，使用本地存储')
    }
  },

  // 加载宝宝信息
  loadBabyInfo: function () {
    const babyInfo = wx.getStorageSync('babyInfo')
    if (babyInfo) {
      this.globalData.babyInfo = babyInfo
    } else {
      // 默认宝宝信息
      this.globalData.babyInfo = {
        name: '小宝宝',
        birthDate: '',
        gender: 'unknown',
        avatar: ''
      }
    }
  },

  // 加载本地缓存记录
  loadLocalRecords: function () {
    const localRecords = wx.getStorageSync('localRecords') || []
    this.globalData.localRecords = localRecords
  },

  // 保存记录到本地和云端
  saveRecord: function (record, callback) {
    // 先生成ID
    record.id = Date.now().toString()
    record.createdAt = util.formatTime(new Date())

    // 保存到本地缓存
    const localRecords = wx.getStorageSync('localRecords') || []
    localRecords.unshift(record)
    wx.setStorageSync('localRecords', localRecords)
    this.globalData.localRecords = localRecords

    // 尝试同步到云端
    if (this.globalData.envId) {
      db.addRecord(record).then(res => {
        if (callback) callback({ success: true, fromCloud: true })
      }).catch(err => {
        console.log('云同步失败，使用本地存储', err)
        if (callback) callback({ success: true, fromCloud: false })
      })
    } else {
      if (callback) callback({ success: true, fromCloud: false })
    }
  },

  // 删除记录
  deleteRecord: function (recordId, callback) {
    // 从本地删除
    let localRecords = wx.getStorageSync('localRecords') || []
    localRecords = localRecords.filter(r => r.id !== recordId)
    wx.setStorageSync('localRecords', localRecords)
    this.globalData.localRecords = localRecords

    // 尝试从云端删除
    if (this.globalData.envId) {
      db.deleteRecord(recordId).then(res => {
        if (callback) callback({ success: true })
      }).catch(err => {
        console.log('云端删除失败', err)
        if (callback) callback({ success: true })
      })
    } else {
      if (callback) callback({ success: true })
    }
  },

  // 获取今日统计
  getTodayStats: function () {
    const records = wx.getStorageSync('localRecords') || []
    const today = util.formatDate(new Date())
    
    const todayRecords = records.filter(r => {
      const recordDate = r.createdAt.split(' ')[0]
      return recordDate === today
    })

    let feedCount = 0
    let diaperCount = 0
    let sleepMinutes = 0

    todayRecords.forEach(r => {
      switch (r.type) {
        case 'feed':
          feedCount++
          break
        case 'diaper':
          diaperCount++
          break
        case 'sleep':
          if (r.wakeTime) {
            const start = new Date(r.sleepTime)
            const end = new Date(r.wakeTime)
            sleepMinutes += Math.round((end - start) / 60000)
          }
          break
      }
    })

    return {
      feedCount,
      diaperCount,
      sleepHours: (sleepMinutes / 60).toFixed(1),
      sleepMinutes
    }
  },

  // 更新宝宝信息
  updateBabyInfo: function (info) {
    this.globalData.babyInfo = info
    wx.setStorageSync('babyInfo', info)
  }
})
