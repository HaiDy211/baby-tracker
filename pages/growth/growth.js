// 成长记录页面
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    // 记录数据
    weight: '',      // 体重(kg)
    height: '',      // 身高(cm)
    headCircumference: '', // 头围(cm)
    // 记录时间
    recordTime: '',
    recordDate: '',
    // 备注
    note: '',
    // 宝宝相关
    babyList: [],
    selectedBabyIndex: 0,
    selectedBabyName: '',
    selectedBabyId: '',
    // 图表类型
    chartType: 'weight',  // weight/height/head
    // 图表数据
    chartData: [],
    chartLabels: [],
    // 最近记录
    recentRecords: [],
    // 图表配置
    canvasWidth: 320,
    canvasHeight: 200,
    // 编辑状态
    isEditing: false,
    editingRecordId: ''
  },

  onLoad: function(options) {
    this.initTime()
    this.initChart()
    this.loadBabyList()

    // 如果有 recordId 参数，说明是从记录列表进入编辑的
    if (options.recordId) {
      this.loadRecordForEdit(options.recordId)
    }
  },

  onShow: function() {
    this.loadBabyList()
    this.initChart()
  },

  // 加载宝宝列表
  loadBabyList: function() {
    const babyList = app.globalData.babyList || []
    const currentBabyId = app.globalData.currentBabyId || ''
    
    let selectedBabyIndex = 0
    if (currentBabyId) {
      selectedBabyIndex = babyList.findIndex(b => b.babyId === currentBabyId)
      if (selectedBabyIndex === -1) selectedBabyIndex = 0
    }
    
    this.setData({
      babyList: babyList,
      selectedBabyIndex: selectedBabyIndex,
      selectedBabyName: babyList[selectedBabyIndex]?.name || '',
      selectedBabyId: babyList[selectedBabyIndex]?.babyId || ''
    })
  },

  // 初始化时间
  initTime: function() {
    const now = new Date()
    this.setData({
      recordTime: util.formatTimeShort(now),
      recordDate: util.formatDate(now)
    })
  },

  // 初始化图表
  initChart: function() {
    const that = this
    wx.getSystemSetting({
      success: function(res) {
        that.setData({
          canvasWidth: res.windowWidth - 80,
          canvasHeight: 200
        })
      }
    })
  },

  // 加载记录用于编辑
  loadRecordForEdit: function(recordId) {
    app.getRecords({ type: 'growth', limit: 100 }).then(records => {
      const record = records.find(r => r._id === recordId)
      if (!record) return

      const data = record.data || record
      const dateTime = new Date(record._createTime)
      const date = util.formatDate(dateTime)
      const time = util.formatTimeShort(dateTime)

      this.setData({
        isEditing: true,
        editingRecordId: recordId,
        weight: data.weight ? String(data.weight) : '',
        height: data.height ? String(data.height) : '',
        headCircumference: data.headCircumference ? String(data.headCircumference) : '',
        recordDate: date,
        recordTime: time,
        note: data.note || ''
      })
    }).catch(err => {
      console.error('加载记录失败', err)
    })
  },

  // 更新图表数据
  updateChart: function() {
    const records = this.data.recentRecords.slice(-5).reverse()
    const chartType = this.data.chartType
    
    let values = []
    let labels = []
    
    records.forEach(r => {
      const dateStr = util.formatDate(new Date(r._createTime))
      const dateParts = dateStr.split('-')
      const label = `${dateParts[1]}/${dateParts[2]}`
      labels.push(label)
      
      switch (chartType) {
        case 'weight':
          values.push(r.weight ? parseFloat(r.weight) : null)
          break
        case 'height':
          values.push(r.height ? parseFloat(r.height) : null)
          break
        case 'head':
          values.push(r.headCircumference ? parseFloat(r.headCircumference) : null)
          break
      }
    })

    this.setData({
      chartData: values,
      chartLabels: labels
    })

    // 绘制图表
    if (values.length > 0) {
      this.drawChart(values, labels)
    }
  },

  // 绘制折线图
  drawChart: function(data, labels) {
    const that = this
    const query = wx.createSelectorQuery()
    
    query.select('#chart-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        
        // 设置canvas尺寸
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        
        const width = res[0].width
        const height = res[0].height
        const padding = { top: 20, right: 20, bottom: 40, left: 50 }
        
        // 过滤有效数据
        const validData = data.filter(d => d !== null && d !== undefined)
        if (validData.length === 0) return
        
        // 计算极值
        const minVal = Math.min(...validData) * 0.95
        const maxVal = Math.max(...validData) * 1.05
        const range = maxVal - minVal || 1
        
        // 清除画布
        ctx.clearRect(0, 0, width, height)
        
        // 绘制网格线
        ctx.strokeStyle = '#F0F0F0'
        ctx.lineWidth = 1
        
        const gridCount = 4
        for (let i = 0; i <= gridCount; i++) {
          const y = padding.top + (height - padding.top - padding.bottom) * i / gridCount
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()
          
          // Y轴标签
          const value = maxVal - (range * i / gridCount)
          ctx.fillStyle = '#999999'
          ctx.font = '20rpx sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(value.toFixed(1), padding.left - 10, y + 6)
        }
        
        // 绘制X轴标签
        ctx.fillStyle = '#999999'
        ctx.font = '20rpx sans-serif'
        ctx.textAlign = 'center'
        labels.forEach((label, i) => {
          const x = padding.left + (width - padding.left - padding.right) * i / (labels.length - 1 || 1)
          ctx.fillText(label, x, height - 10)
        })
        
        // 计算点位置
        const points = data.map((d, i) => {
          if (d === null || d === undefined) return null
          const x = padding.left + (width - padding.left - padding.right) * i / (data.length - 1 || 1)
          const y = padding.top + (height - padding.top - padding.bottom) * (1 - (d - minVal) / range)
          return { x, y, value: d }
        }).filter(p => p !== null)
        
        if (points.length < 2) {
          // 只有单个点
          if (points.length === 1) {
            ctx.beginPath()
            ctx.arc(points[0].x, points[0].y, 6, 0, 2 * Math.PI)
            ctx.fillStyle = '#98FB98'
            ctx.fill()
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            ctx.stroke()
          }
          return
        }
        
        // 绘制折线
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.forEach((p, i) => {
          if (i > 0) {
            ctx.lineTo(p.x, p.y)
          }
        })
        ctx.strokeStyle = '#98FB98'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // 绘制渐变填充
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
        gradient.addColorStop(0, 'rgba(152, 251, 152, 0.3)')
        gradient.addColorStop(1, 'rgba(152, 251, 152, 0)')
        
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
        ctx.lineTo(points[0].x, height - padding.bottom)
        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()
        
        // 绘制数据点
        points.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI)
          ctx.fillStyle = '#98FB98'
          ctx.fill()
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // 数据值标签
          ctx.fillStyle = '#666666'
          ctx.font = '18rpx sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(p.value.toFixed(1), p.x, p.y - 12)
        })
      })
  },

  // 切换图表类型
  switchChart: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ chartType: type })
    this.updateChart()
  },

  // 输入体重
  inputWeight: function(e) {
    this.setData({ weight: e.detail.value })
  },

  // 输入身高
  inputHeight: function(e) {
    this.setData({ height: e.detail.value })
  },

  // 输入头围
  inputHeadCircumference: function(e) {
    this.setData({ headCircumference: e.detail.value })
  },

  // 修改时间
  bindTimeChange: function(e) {
    this.setData({ recordTime: e.detail.value })
  },

  // 修改日期
  bindDateChange: function(e) {
    this.setData({ recordDate: e.detail.value })
  },

  // 输入备注
  inputNote: function(e) {
    this.setData({ note: e.detail.value })
  },
  // 保存记录（入口方法）
  saveRecord: function() {
    this.submitRecord()
  },

  // 提交记录
  submitRecord: function() {
    const { weight, height, headCircumference, recordTime, recordDate, note, isEditing, editingRecordId } = this.data
    
    // 至少填写一项
    if (!weight && !height && !headCircumference) {
      wx.showToast({
        title: '请至少填写一项数据',
        icon: 'none'
      })
      return
    }

    // 检查是否已登录且有家庭
    if (!app.globalData.familyInfo || !app.globalData.currentBaby) {
      wx.showToast({
        title: '请先加入家庭并添加宝宝',
        icon: 'none'
      })
      return
    }

    const record = {
      type: 'growth',
      createdAt: `${recordDate} ${recordTime}:00`,
      data: {
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        headCircumference: headCircumference ? parseFloat(headCircumference) : null,
        note: note
      }
    }

    const saveCallback = (result) => {
      if (result.success) {
        wx.showToast({
          title: isEditing ? '已更新' : '记录成功',
          icon: 'success'
        })
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
            fail: function() {
              wx.switchTab({ url: '/pages/timeline/timeline' })
            }
          })
        }, 1000)
      } else {
        wx.showToast({
          title: result.error || '保存失败',
          icon: 'none'
        })
      }
    }

    if (isEditing && editingRecordId) {
      app.updateRecord(editingRecordId, record, saveCallback)
    } else {
      app.saveRecord(record, saveCallback)
    }
  },

  // 删除当前编辑的记录
  deleteEditingRecord: function() {
    if (!this.data.editingRecordId) return
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: res => {
        if (res.confirm) {
          app.deleteRecord(this.data.editingRecordId, result => {
            if (result.success) {
              wx.showToast({ title: '已删除', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1000)
              wx.showToast({
                title: '已删除',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 取消编辑
  cancelEdit: function() {
    this.resetForm()
  },

  // 重置表单
  resetForm: function() {
    this.setData({
      isEditing: false,
      editingRecordId: '',
      weight: '',
      height: '',
      headCircumference: '',
      note: ''
    })
    this.initTime()
  }
})
