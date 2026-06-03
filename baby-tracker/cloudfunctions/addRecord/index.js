// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'addRecord':
      return await addRecord(data)
    case 'getRecords':
      return await getRecords(data)
    case 'deleteRecord':
      return await deleteRecord(data)
    case 'getTodayStats':
      return await getTodayStats()
    default:
      return { success: false, message: '未知操作' }
  }
}

// 添加记录
async function addRecord(data) {
  try {
    data._createTime = Date.now()
    const result = await db.collection('records').add({
      data: data
    })
    return { success: true, id: result._id }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// 获取记录列表
async function getRecords(data = {}) {
  try {
    let query = db.collection('records')
    
    if (data.type) {
      query = query.where({ type: data.type })
    }

    const result = await query
      .orderBy('_createTime', 'desc')
      .limit(data.limit || 100)
      .get()

    return { success: true, data: result.data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// 删除记录
async function deleteRecord(data) {
  try {
    const result = await db.collection('records').doc(data.id).remove()
    return { success: true, deleted: result.stats.removed }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// 获取今日统计
async function getTodayStats() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = await db.collection('records')
      .where({
        _createTime: db.command.gte(today.getTime()).and(db.command.lt(tomorrow.getTime()))
      })
      .get()

    const records = result.data
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

    return {
      success: true,
      stats: {
        feedCount,
        diaperCount,
        sleepHours: (sleepMinutes / 60).toFixed(1),
        sleepMinutes
      }
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}
