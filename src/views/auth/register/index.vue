<template>
  <div class="login register">
    <LoginLeftView></LoginLeftView>
    <div class="right-wrap">
      <AuthTopBar />
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">创建账号</h3>
          <p class="sub-title">欢迎加入我们，请填写以下信息完成注册</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-position="top"
          >
            <ElFormItem prop="username">
              <ElInput
                v-model.trim="formData.username"
                placeholder="请输入账号"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                v-model.trim="formData.password"
                placeholder="请输入密码"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirmPassword">
              <ElInput
                v-model.trim="formData.confirmPassword"
                placeholder="请再次输入密码"
                type="password"
                autocomplete="off"
                @keyup.enter="register"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="agreement">
              <ElCheckbox v-model="formData.agreement">
                我同意
                <router-link
                  style="color: var(--main-color); text-decoration: none"
                  to="/privacy-policy"
                  >《隐私政策》</router-link
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="register-btn"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                注册
              </ElButton>
            </div>

            <div class="footer">
              <p>
                已有账号？
                <router-link :to="{ name: 'Login' }">去登录</router-link>
              </p>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'Register' })

  interface RegisterForm {
    username: string
    password: string
    confirmPassword: string
    agreement: boolean
  }

  const USERNAME_MIN_LENGTH = 3
  const USERNAME_MAX_LENGTH = 20
  const PASSWORD_MIN_LENGTH = 6
  const REDIRECT_DELAY = 1000

  const router = useRouter()
  const formRef = ref<FormInstance>()

  const systemName = AppConfig.systemInfo.name
  const loading = ref(false)

  const formData = reactive<RegisterForm>({
    username: '',
    password: '',
    confirmPassword: '',
    agreement: false
  })

  /**
   * 验证密码
   * 当密码输入后，如果确认密码已填写，则触发确认密码的验证
   */
  const validatePassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error('请输入密码'))
      return
    }

    if (formData.confirmPassword) {
      formRef.value?.validateField('confirmPassword')
    }

    callback()
  }

  /**
   * 验证确认密码
   * 检查确认密码是否与密码一致
   */
  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (!value) {
      callback(new Error('请再次输入密码'))
      return
    }

    if (value !== formData.password) {
      callback(new Error('两次输入密码不一致!'))
      return
    }

    callback()
  }

  /**
   * 验证用户协议
   * 确保用户已勾选同意协议
   */
  const validateAgreement = (_rule: any, value: boolean, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error('请同意隐私协议'))
      return
    }
    callback()
  }

  const rules = computed<FormRules<RegisterForm>>(() => ({
    username: [
      { required: true, message: '请输入账号', trigger: 'blur' },
      {
        min: USERNAME_MIN_LENGTH,
        max: USERNAME_MAX_LENGTH,
        message: '长度在 3 到 20 个字符',
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, validator: validatePassword, trigger: 'blur' },
      { min: PASSWORD_MIN_LENGTH, message: '密码长度不能小于6位', trigger: 'blur' }
    ],
    confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
    agreement: [{ validator: validateAgreement, trigger: 'change' }]
  }))

  /**
   * 注册用户
   * 验证表单后提交注册请求
   */
  const register = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      // TODO: 替换为真实 API 调用
      // const params = {
      //   username: formData.username,
      //   password: formData.password
      // }
      // const res = await AuthService.register(params)
      // if (res.code === ApiStatus.success) {
      //   ElMessage.success('注册成功')
      //   toLogin()
      // }

      // 模拟注册请求
      setTimeout(() => {
        loading.value = false
        ElMessage.success('注册成功')
        toLogin()
      }, REDIRECT_DELAY)
    } catch (error) {
      console.error('表单验证失败:', error)
      loading.value = false
    }
  }

  /**
   * 跳转到登录页面
   */
  const toLogin = () => {
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, REDIRECT_DELAY)
  }
</script>

<style lang="scss" scoped>
  @use '../login/index' as login;
  @use './index' as register;
</style>
