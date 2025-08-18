# baize-compress-image

## 1.0.0

### Breaking Changes

- 🔄 **返回类型调整**: `compressImageWorker` 和 `compressImagesWorker` 函数现在返回 `CompressBackInfo` 类型，包含压缩信息和文件
- 📊 **压缩信息增强**: 返回数据现在包含压缩率（rate）、压缩耗时（time）、原始大小（originalSize）、压缩后大小（compressedSize）信息

### Features

- ✨ **压缩统计**: 新增压缩率计算，显示压缩前后文件大小变化百分比
- ⏱️ **性能监控**: 新增压缩耗时统计，精确到毫秒级别
- 📏 **文件大小对比**: 新增原始文件大小和压缩后文件大小显示，支持 KB 单位
- 🎯 **类型安全**: 提供完整的 TypeScript 类型定义支持

## 0.0.7

修复并发压缩问题

## 0.0.6

移除 workerpool 修复使用异常报错问题

## 0.0.5

### Performance Improvements

- 🚀 **重大性能优化**: 使用 Transferable Objects 替代 localforage 进行图片数据传输
- ⚡ **零拷贝传输**: 图片数据通过 ArrayBuffer 直接传输，避免数据复制
- 🔄 **双向优化**: Worker 返回 ArrayBuffer 数据，主线程重新构造 File 对象，避免 File 对象序列化开销
- 💾 **内存优化**: 减少内存占用和垃圾回收压力
- 🔧 **依赖优化**: 移除 localforage 依赖，减少包体积

## 0.0.4

### Patch Changes

- 添加 png 和 webp 图片的压缩适配
