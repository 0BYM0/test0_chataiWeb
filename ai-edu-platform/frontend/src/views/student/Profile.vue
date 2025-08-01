<template>
  <div class="profile-container">
    <t-card :bordered="false">
      <div class="header">
        <h2>个人中心</h2>
      </div>

      <t-tabs v-model="activeTab">
        <t-tab-panel value="info" label="基本信息">
          <div class="profile-section">
            <t-form
              ref="infoForm"
              :data="userInfo"
              :rules="infoRules"
              label-align="top"
              @submit.prevent="updateInfo"
            >
              <t-form-item label="用户名" name="username">
                <t-input v-model="userInfo.username" placeholder="请输入用户名" />
              </t-form-item>
              <t-form-item label="邮箱" name="email">
                <t-input v-model="userInfo.email" placeholder="请输入邮箱" />
              </t-form-item>
              <t-form-item label="头像" name="avatar">
                <t-upload
                  v-model="avatarFile"
                  theme="image"
                  :size-limit="{ size: 2, unit: 'MB' }"
                  accept="image/*"
                  :before-upload="beforeAvatarUpload"
                  :request-method="uploadAvatar"
                />
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" type="submit" :loading="isSavingInfo">保存更改</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>

        <t-tab-panel value="security" label="安全设置">
          <div class="profile-section">
            <h4>修改密码</h4>
            <t-form
              ref="passwordForm"
              :data="passwordData"
              :rules="passwordRules"
              label-align="top"
              @submit.prevent="changePassword"
            >
              <t-form-item label="当前密码" name="currentPassword">
                <t-input v-model="passwordData.currentPassword" type="password" placeholder="请输入当前密码" />
              </t-form-item>
              <t-form-item label="新密码" name="newPassword">
                <t-input v-model="passwordData.newPassword" type="password" placeholder="请输入新密码" />
              </t-form-item>
              <t-form-item label="确认新密码" name="confirmPassword">
                <t-input v-model="passwordData.confirmPassword" type="password" placeholder="请再次输入新密码" />
              </t-form-item>
              <t-form-item>
                <t-button theme="primary" type="submit" :loading="isChangingPassword">确认修改</t-button>
              </t-form-item>
            </t-form>
          </div>
        </t-tab-panel>
      </t-tabs>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useUserStore } from '../../stores/user';
import { MessagePlugin } from 'tdesign-vue-next';

const userStore = useUserStore();

// 响应式状态
const activeTab = ref('info');
const isSavingInfo = ref(false);
const isChangingPassword = ref(false);
const avatarFile = ref([]);

// 表单引用
const infoForm = ref(null);
const passwordForm = ref(null);

// 用户信息表单
const userInfo = reactive({
  username: '',
  email: '',
  avatar: '',
});

// 密码修改表单
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 表单校验规则
const infoRules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { email: true, message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
};

const passwordRules = {
  currentPassword: [{ required: true, message: '当前密码不能为空', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (val) => val === passwordData.newPassword,
      message: '两次输入的密码不一致',
      trigger: 'blur',
    },
  ],
};

// 生命周期钩子
onMounted(() => {
  // 从 userStore 加载用户信息
  if (userStore.user) {
    userInfo.username = userStore.user.username;
    userInfo.email = userStore.user.email;
    userInfo.avatar = userStore.user.avatar;
    if (userStore.user.avatar) {
      avatarFile.value = [{ url: userStore.user.avatar, name: 'avatar.png' }];
    }
  }
});

// 方法
const updateInfo = async () => {
  const result = await infoForm.value.validate();
  if (result === true) {
    isSavingInfo.value = true;
    try {
      await userStore.updateProfile({
        username: userInfo.username,
        email: userInfo.email,
      });
      MessagePlugin.success('信息更新成功');
    } catch (error) {
      MessagePlugin.error(error.message || '更新失败');
    } finally {
      isSavingInfo.value = false;
    }
  }
};

const changePassword = async () => {
  const result = await passwordForm.value.validate();
  if (result === true) {
    isChangingPassword.value = true;
    try {
      await userStore.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      MessagePlugin.success('密码修改成功');
      passwordForm.value.reset();
    } catch (error) {
      MessagePlugin.error(error.message || '密码修改失败');
    } finally {
      isChangingPassword.value = false;
    }
  }
};

const beforeAvatarUpload = (file) => {
  if (file.size > 2 * 1024 * 1024) {
    MessagePlugin.warning('图片大小不能超过 2MB');
    return false;
  }
  return true;
};

const uploadAvatar = async (file) => {
  try {
    const newAvatarUrl = await userStore.uploadAvatar(file.raw);
    userInfo.avatar = newAvatarUrl;
    avatarFile.value = [{ url: newAvatarUrl, name: file.name, status: 'success' }];
    MessagePlugin.success('头像上传成功');
    return { status: 'success', response: { url: newAvatarUrl } };
  } catch (error) {
    MessagePlugin.error(error.message || '上传失败');
    return { status: 'fail', error: '上传失败' };
  }
};
</script>

<style scoped>
.profile-container {
  padding: 24px;
}

.header {
  margin-bottom: 20px;
}

.profile-section {
  max-width: 600px;
  margin-top: 20px;
}
</style>