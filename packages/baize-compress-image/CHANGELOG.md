# baize-compress-image

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
