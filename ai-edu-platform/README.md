# 智能教育应用平台

## 项目概述

智能教育应用平台是一个面向广东省义务教育阶段学生和教师的Web应用，旨在辅助学生的人工智能知识学习和教师的人工智能教学。平台基于Vue前端框架、Spring Boot后端框架和Supabase数据库，集成了基于AutoGen框架的多智能体系统和基于LangChain框架的单智能体系统。

## 系统架构

### 前端 (Vue)
- 运行在 localhost:5173
- 使用Vue 3框架和Pinia状态管理
- 提供学生和教师不同的界面和功能

### 后端 (Spring Boot)
- 运行在 localhost:8080
- 提供RESTful API接口
- 处理用户认证、数据存储和业务逻辑

### AI服务
- 多智能体系统：基于AutoGen框架，为学生提供人工智能知识学习
- 单智能体系统：基于LangChain框架，为教师提供教案生成和教学设计
- 两个系统均支持RAG（检索增强生成）功能
- 通过FastAPI封装，提供统一的API接口

### 数据库
- 使用Supabase作为数据库服务
- 存储用户信息、对话历史、教案等数据

## 核心功能

### 多智能体系统
- 基于《广东省中小学学生人工智能素养框架》四大维度设计
- 遵循《课程指导纲要》中的学段目标递进原则
- 包含专家智能体、助教智能体、同伴智能体等角色
- 采用苏格拉底式对话风格，引导学生思考

### 单智能体系统
- 快速生成符合《纲要》要求的高质量教学设计
- 支持根据学段、年级、课程模块等定制教案
- 提供教学知识问答功能
- 支持导出多种格式的教案

## 技术特点

- 使用Kimi-k2大语言模型，通过环境变量配置API密钥
- 集成RAG功能，提高回答的准确性和相关性
- 支持知识库管理，可上传和检索教育相关文档
- 前后端分离架构，便于维护和扩展

## 部署说明

### 环境要求
- Node.js 16+
- Java 17+
- Python 3.10+
- Docker和Docker Compose（用于生产环境部署）

### 本地开发
1. 克隆代码库
2. 配置环境变量（特别是MOONSHOT_API_KEY）
3. 启动各个服务：
   - 前端：`cd frontend && npm install && npm run dev`
   - 后端：`cd backend && mvn spring-boot:run`
   - AI服务：`cd ai-service && python start.py`

### 生产环境部署
使用项目根目录下的`deploy.sh`脚本进行部署：
```bash
./deploy.sh
```

详细的部署步骤请参考部署目录中的README.md文件。

## 目录结构

```
ai-edu-platform/
├── frontend/             # Vue前端代码
├── backend/              # Spring Boot后端代码
├── ai-service/           # AI服务代码
│   ├── multi_agent/      # 多智能体系统
│   ├── single_agent/     # 单智能体系统
│   └── start.py          # 启动脚本
├── deploy.sh             # 部署脚本
└── README.md             # 项目说明文档
```

## 开发团队

本项目由智能教育应用开发团队开发，旨在推动人工智能教育在广东省义务教育阶段的普及和应用。

## 许可证

本项目采用MIT许可证。