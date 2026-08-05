<template>
  <ElConfigProvider size="default" :locale="zh" :z-index="3000">
    <RouterView></RouterView>
    <!-- 原型标注层：仅用于需求标注展示与编辑 -->
    <AnnotationOverlay />
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import { systemUpgrade } from './utils/sys'

  import { setThemeTransitionClass } from './utils/theme/animation'
  import { checkStorageCompatibility } from './utils/storage'
  import AnnotationOverlay from './components/Annotation/AnnotationOverlay.vue'

  onBeforeMount(() => {
    setThemeTransitionClass(true)
  })

  onMounted(() => {
    // 检查存储兼容性
    checkStorageCompatibility()
    // 提升暗黑主题下页面刷新视觉体验
    setThemeTransitionClass(false)
    // 系统升级
    systemUpgrade()
  })
</script>
