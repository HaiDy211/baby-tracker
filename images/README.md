# TabBar 图标说明

微信小程序TabBar需要PNG格式的图标文件。

## 需要创建的图标文件

1. `images/home.png` - 首页图标
2. `images/home-active.png` - 首页选中图标
3. `images/timeline.png` - 时间线图标
4. `images/timeline-active.png` - 时间线选中图标
5. `images/my.png` - 我的图标
6. `images/my-active.png` - 我的选中图标

## 图标尺寸要求

- 推荐尺寸：81x81 像素
- 支持格式：PNG（推荐）、GIF、JPEG、WebP
- 图标大小不超过 40KB

## 临时解决方案

如果暂时没有图标文件，可以在 app.json 中将 iconPath 和 selectedIconPath 改为空字符串或注释掉，小程序会自动使用文字标签显示。
