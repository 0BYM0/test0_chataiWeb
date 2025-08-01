# 智能教育应用平台 - 腾讯云开发CloudBase部署指南

本文档提供了将智能教育应用平台部署到腾讯云开发CloudBase的详细指南。

## 部署架构

- **前端**：Vue.js应用，部署在CloudBase静态网站托管
- **后端**：Spring Boot应用，部署在CloudBase云托管
- **AI服务**：Python应用(AutoGen多智能体系统和LangChain单智能体系统)，部署在CloudBase云托管
- **数据库**：Supabase(外部PostgreSQL数据库)

## 前置条件

1. 已创建腾讯云开发CloudBase环境(当前环境ID: cloud1-0g0mbccz12f37fb3)
2. 已安装CloudBase CLI工具
3. 已配置Supabase数据库
4. 已设置MOONSHOT_API_KEY环境变量(用于AI服务)

## 手动部署步骤

### 1. 准备环境变量

确保已经创建了`cloudbase-env.json`文件，包含所有必要的环境变量。

### 2. 部署前端应用

```bash
# 构建前端应用
cd frontend
npm install
npm run build

# 部署到CloudBase静态网站托管
cloudbase hosting:deploy ./dist -e cloud1-0g0mbccz12f37fb3
```

### 3. 部署后端应用

```bash
# 构建后端应用
cd backend
mvn clean package -DskipTests

# 构建Docker镜像并部署到CloudBase云托管
docker build -t ai-edu-backend .
cloudbase service:create -e cloud1-0g0mbccz12f37fb3 -n ai-edu-backend -i ai-edu-backend
```

### 4. 部署AI服务

```bash
# 构建Docker镜像并部署到CloudBase云托管
cd ai-service
docker build -t ai-edu-ai-service .
cloudbase service:create -e cloud1-0g0mbccz12f37fb3 -n ai-edu-ai-service -i ai-edu-ai-service
```

### 5. 配置环境变量

```bash
# 为云托管服务设置环境变量
cloudbase service:config -e cloud1-0g0mbccz12f37fb3 -n ai-edu-backend --env-file ./cloudbase-env.json
cloudbase service:config -e cloud1-0g0mbccz12f37fb3 -n ai-edu-ai-service --env-file ./cloudbase-env.json
```

## 自动部署(CI/CD)

本项目已配置GitHub Actions工作流，可以自动部署到CloudBase环境。只需要在GitHub仓库中设置以下密钥：

- `CLOUDBASE_SECRET_ID`: 腾讯云API密钥ID
- `CLOUDBASE_SECRET_KEY`: 腾讯云API密钥Key
- `MOONSHOT_API_KEY`: Moonshot API密钥(用于AI服务)

然后，每次推送到main分支时，都会自动触发部署流程。

## 访问应用

部署完成后，可以通过以下URL访问应用：

- 前端应用: https://cloud1-0g0mbccz12f37fb3-1354189051.tcloudbaseapp.com
- 后端API: https://ai-edu-backend-cloud1-0g0mbccz12f37fb3.service.tcloudbase.com
- AI服务API: https://ai-edu-ai-service-cloud1-0g0mbccz12f37fb3.service.tcloudbase.com

## 常见问题

1. **部署失败**：检查CloudBase CLI是否正确安装，环境变量是否正确设置。
2. **服务无法访问**：检查网络配置和安全组设置。
3. **AI服务无响应**：检查MOONSHOT_API_KEY是否正确设置。