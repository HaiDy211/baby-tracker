// 数据库操作封装

// 云数据库引用
let db = null

// 初始化数据库
function initDB() {
  const app = getApp()
  if (!db && app && app.globalData && app.globalData.envId) {
    db = wx.cloud.database({
      env: app.globalData.envId
    })
  }
  return db
}

// ==================== 用户表操作 ====================

// 获取或创建用户
function getOrCreateUser(userInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('users').where({
      openid: userInfo.openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        // 用户已存在，更新信息
        const user = res.data[0]
        database.collection('users').doc(user._id).update({
          data: {
            nickname: userInfo.nickname,
            avatarUrl: userInfo.avatarUrl,
            updatedAt: Date.now()
          }
        }).then(() => {
          resolve({ ...user, nickname: userInfo.nickname, avatarUrl: userInfo.avatarUrl })
        })
      } else {
        // 创建新用户
        database.collection('users').add({
          data: {
            openid: userInfo.openid,
            nickname: userInfo.nickname,
            avatarUrl: userInfo.avatarUrl,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }).then(res => {
          resolve({
            _id: res._id,
            openid: userInfo.openid,
            nickname: userInfo.nickname,
            avatarUrl: userInfo.avatarUrl
          })
        })
      }
    }).catch(err => {
      reject(err)
    })
  })
}

// 更新用户信息
function updateUser(userInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('users').where({
      openid: userInfo.openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        const user = res.data[0]
        database.collection('users').doc(user._id).update({
          data: {
            nickname: userInfo.nickname || user.nickname,
            avatarUrl: userInfo.avatarUrl || user.avatarUrl,
            updatedAt: Date.now()
          }
        }).then(() => {
          resolve({ ...user, nickname: userInfo.nickname, avatarUrl: userInfo.avatarUrl })
        }).catch(reject)
      } else {
        // 用户不存在，创建新用户
        getOrCreateUser(userInfo).then(resolve).catch(reject)
      }
    }).catch(reject)
  })
}

// 根据 openid 获取用户
function getUserByOpenid(openid) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('users').where({
      openid: openid
    }).get().then(res => {
      resolve(res.data && res.data.length > 0 ? res.data[0] : null)
    }).catch(err => {
      reject(err)
    })
  })
}

// ==================== 家庭表操作 ====================

// 生成6位邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 创建家庭
function createFamily(name, ownerInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    // 检查邀请码是否重复
    const inviteCode = generateInviteCode()

    database.collection('families').add({
      data: {
        name: name,
        inviteCode: inviteCode,
        ownerId: ownerInfo.userId,
        members: [{
          userId: ownerInfo.userId,
          role: 'owner',
          nickname: ownerInfo.nickname,
          avatarUrl: ownerInfo.avatarUrl,
          title: ownerInfo.title || '爸爸',
          joinedAt: Date.now()
        }],
        babies: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }).then(res => {
      resolve({
        _id: res._id,
        inviteCode: inviteCode
      })
    }).catch(err => {
      reject(err)
    })
  })
}

// 根据邀请码查找家庭
function findFamilyByInviteCode(inviteCode) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').where({
      inviteCode: inviteCode.toUpperCase()
    }).get().then(res => {
      resolve(res.data && res.data.length > 0 ? res.data[0] : null)
    }).catch(err => {
      reject(err)
    })
  })
}

// 加入家庭
function joinFamily(familyId, memberInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').doc(familyId).update({
      data: {
        members: database.command.push([{
          userId: memberInfo.userId,
          role: 'member',
          nickname: memberInfo.nickname,
          avatarUrl: memberInfo.avatarUrl,
          title: memberInfo.title,
          joinedAt: Date.now()
        }]),
        updatedAt: Date.now()
      }
    }).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  })
}

// 获取用户的家庭
function getUserFamily(userId) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').where({
      'members.userId': userId
    }).get().then(res => {
      resolve(res.data && res.data.length > 0 ? res.data[0] : null)
    }).catch(err => {
      reject(err)
    })
  })
}

// 更新家庭成员称呼
function updateMemberTitle(familyId, userId, title) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    // 需要先获取家庭，然后更新 members 数组中对应成员的 title
    database.collection('families').doc(familyId).get().then(res => {
      const family = res.data
      const members = family.members.map(m => {
        if (m.userId === userId) {
          return { ...m, title: title }
        }
        return m
      })

      database.collection('families').doc(familyId).update({
        data: {
          members: members,
          updatedAt: Date.now()
        }
      }).then(resolve).catch(reject)
    }).catch(err => {
      reject(err)
    })
  })
}

// 退出家庭
function leaveFamily(familyId, userId) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').doc(familyId).get().then(res => {
      const family = res.data
      const members = family.members.filter(m => m.userId !== userId)

      if (members.length === 0) {
        // 没有成员了，删除家庭
        database.collection('families').doc(familyId).remove().then(resolve).catch(reject)
      } else {
        // 仍有成员，更新成员列表
        database.collection('families').doc(familyId).update({
          data: {
            members: members,
            updatedAt: Date.now()
          }
        }).then(resolve).catch(reject)
      }
    }).catch(err => {
      reject(err)
    })
  })
}

// 解散家庭
function deleteFamily(familyId) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    // 删除家庭
    database.collection('families').doc(familyId).remove()
      .then(() => {
        // 删除家庭的所有记录
        database.collection('records').where({
          familyId: familyId
        }).remove().then(resolve).catch(reject)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// ==================== 宝宝管理 ====================

// 添加宝宝
function addBaby(familyId, babyInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    const babyId = Date.now().toString()
    const baby = {
      babyId: babyId,
      name: babyInfo.name,
      birthDate: babyInfo.birthDate,
      gender: babyInfo.gender || 'unknown',
      avatar: babyInfo.avatar || '',
      isDefault: babyInfo.isDefault || false,
      createdAt: Date.now()
    }

    database.collection('families').doc(familyId).get().then(res => {
      const family = res.data
      let babies = [...family.babies, baby]

      // 如果新宝宝是默认宝宝，取消其他默认
      if (baby.isDefault) {
        babies = babies.map(b => ({
          ...b,
          isDefault: b.babyId === babyId
        }))
      }

      database.collection('families').doc(familyId).update({
        data: {
          babies: babies,
          updatedAt: Date.now()
        }
      }).then(() => {
        resolve({ babyId: babyId })
      }).catch(reject)
    }).catch(err => {
      reject(err)
    })
  })
}

// 更新宝宝
function updateBaby(familyId, babyId, babyInfo) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').doc(familyId).get().then(res => {
      const family = res.data
      let babies = family.babies.map(b => {
        if (b.babyId === babyId) {
          return { ...b, ...babyInfo }
        }
        return b
      })

      // 如果设置为默认，取消其他默认
      if (babyInfo.isDefault) {
        babies = babies.map(b => ({
          ...b,
          isDefault: b.babyId === babyId
        }))
      }

      database.collection('families').doc(familyId).update({
        data: {
          babies: babies,
          updatedAt: Date.now()
        }
      }).then(resolve).catch(reject)
    }).catch(err => {
      reject(err)
    })
  })
}

// 删除宝宝
function deleteBaby(familyId, babyId) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    database.collection('families').doc(familyId).get().then(res => {
      const family = res.data
      const babies = family.babies.filter(b => b.babyId !== babyId)

      database.collection('families').doc(familyId).update({
        data: {
          babies: babies,
          updatedAt: Date.now()
        }
      }).then(() => {
        // 删除宝宝的所有记录
        database.collection('records').where({
          familyId: familyId,
          babyId: babyId
        }).remove().then(resolve).catch(reject)
      }).catch(reject)
    }).catch(err => {
      reject(err)
    })
  })
}

// ==================== 记录表操作 ====================

// 添加记录
function addRecord(record) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    record._createTime = Date.now()
    record.updatedAt = Date.now()

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

    // 构建查询条件
    let whereObj = {}
    
    // 按家庭筛选（必须）
    if (options.familyId) {
      whereObj.familyId = options.familyId
    }

    // 按宝宝筛选
    if (options.babyId) {
      whereObj.babyId = options.babyId
    }

    // 按类型筛选
    if (options.type) {
      whereObj.type = options.type
    }

    // 按日期范围筛选
    if (options.startDate || options.endDate) {
      whereObj._createTime = {}
      if (options.startDate) {
        whereObj._createTime.$gte = new Date(options.startDate).getTime()
      }
      if (options.endDate) {
        whereObj._createTime.$lte = new Date(options.endDate).getTime()
      }
    }

    database.collection('records')
      .where(whereObj)
      .orderBy('_createTime', 'desc')
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

    data.updatedAt = Date.now()

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
function getTodayStats(familyId, babyId) {
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

    let query = {
      familyId: familyId,
      _createTime: database.command.gte(today.getTime()).and(database.command.lt(tomorrow.getTime()))
    }

    if (babyId) {
      query.babyId = babyId
    }

    database.collection('records')
      .where(query)
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
function getGrowthRecords(familyId, babyId, limit = 10) {
  return new Promise((resolve, reject) => {
    const database = initDB()
    if (!database) {
      reject(new Error('云数据库未初始化'))
      return
    }

    let query = {
      familyId: familyId,
      type: 'growth'
    }

    if (babyId) {
      query.babyId = babyId
    }

    database.collection('records')
      .where(query)
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
  // 用户
  getOrCreateUser,
  getUserByOpenid,
  updateUser,
  // 家庭
  createFamily,
  findFamilyByInviteCode,
  joinFamily,
  getUserFamily,
  updateMemberTitle,
  leaveFamily,
  deleteFamily,
  // 宝宝
  addBaby,
  updateBaby,
  deleteBaby,
  // 记录
  addRecord,
  getRecords,
  deleteRecord,
  updateRecord,
  getTodayStats,
  getGrowthRecords
}
