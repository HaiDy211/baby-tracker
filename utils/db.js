// 数据库操作封装

const app = getApp()

// 云数据库引用
let db = null

// 初始化数据库
function initDB() {
  if (!db && app.globalData.envId) {
    db = wx.cloud.database({
      env: app.globalData.envId
    })
  }
  return db
}

// 添加记录
function addRecord(record) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }
    
    // 添加时间戳
    record._createTime = Date.now()
    
    database.collection('records').add({
      data: record
    }).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

// 获取记录列表
function getRecords(options = {}) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    let query = database.collection('records')
    
    // 按类型筛选
    if (options.type) {
      query = query.where({
        type: options.type
      })
    }
    
    // 按日期范围筛选
    if (options.startDate) {
      query = query.where({
        _createTime: database.command.gte(new Date(options.startDate).getTime())
      })
    }
    
    if (options.endDate) {
      query = query.where({
        _createTime: database.command.lte(new Date(options.endDate).getTime())
      })
    }

    query.orderBy('_createTime', 'desc')
      .limit(options.limit || 100)
      .get()
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 删除记录
function deleteRecord(recordId) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('records').doc(recordId).remove()
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 更新记录
function updateRecord(recordId, data) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('records').doc(recordId).update({
      data: data
    }).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

// 获取今日统计
function getTodayStats() {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    database.collection('records')
      .where({
        _createTime: database.command.gte(today.getTime()).and(database.command.lt(tomorrow.getTime()))
      })
      .get()
      .then(res => {
        const records = res.data
        let feedCount = 0
        let diaperCount = 0
        let sleepMinutes = 0

        records.forEach(r => {
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

        resolve({
          feedCount,
          diaperCount,
          sleepHours: (sleepMinutes / 60).toFixed(1),
          sleepMinutes
        })
      })
      .catch(err => {
        reject(err)
      })
  })
}

// 获取成长记录（用于绘制图表）
function getGrowthRecords(limit = 10) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('records')
      .where({
        type: 'growth'
      })
      .orderBy('_createTime', 'desc')
      .limit(limit)
      .get()
      .then(res => {
        // 按时间正序排列（用于图表）
        resolve(res.data.reverse())
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = {
  addRecord,
  getRecords,
  deleteRecord,
  updateRecord,
  getTodayStats,
  getGrowthRecords
}
