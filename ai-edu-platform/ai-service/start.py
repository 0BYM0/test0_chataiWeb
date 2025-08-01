import os
import subprocess
import sys
import time
import signal
import threading
import shutil
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import importlib.util

# 检查环境变量
api_key = os.getenv("MOONSHOT_API_KEY")
if not api_key:
    print("错误: 环境变量 MOONSHOT_API_KEY 未设置！")
    print("请设置环境变量后再运行此脚本。")
    print("Windows 示例: set MOONSHOT_API_KEY=your_api_key")
    print("Linux/Mac 示例: export MOONSHOT_API_KEY=your_api_key")
    sys.exit(1)

# 确保知识库目录存在
def setup_knowledge_dirs():
    """设置知识库目录"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 多智能体知识库目录
    multi_agent_knowledge_dir = os.path.join(script_dir, "multi_agent", "knowledge")
    multi_agent_uploads_dir = os.path.join(multi_agent_knowledge_dir, "uploads")
    
    # 单智能体知识库目录
    single_agent_knowledge_dir = os.path.join(script_dir, "single_agent", "knowledge")
    single_agent_uploads_dir = os.path.join(single_agent_knowledge_dir, "uploads")
    
    # 创建目录
    for directory in [multi_agent_knowledge_dir, multi_agent_uploads_dir, 
                     single_agent_knowledge_dir, single_agent_uploads_dir]:
        os.makedirs(directory, exist_ok=True)
        print(f"已确保目录存在: {directory}")

# 创建主FastAPI应用
app = FastAPI(title="AI教育平台API服务", description="提供多智能体和单智能体服务的统一API接口")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 动态导入多智能体和单智能体应用
def import_app(module_path, module_name):
    """动态导入应用模块"""
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app

# 获取当前脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))

# 导入多智能体和单智能体应用
try:
    multi_agent_app = import_app(os.path.join(script_dir, "multi_agent", "app.py"), "multi_agent")
    single_agent_app = import_app(os.path.join(script_dir, "single_agent", "app.py"), "single_agent")
    print("成功导入多智能体和单智能体应用")
except Exception as e:
    print(f"导入应用失败: {e}")
    sys.exit(1)

# 将多智能体和单智能体应用挂载到主应用
app.mount("/multi-agent", multi_agent_app)
app.mount("/single-agent", single_agent_app)

@app.get("/")
async def root():
    """API根路径"""
    return {
        "message": "欢迎使用AI教育平台API服务",
        "services": {
            "multi_agent": "/multi-agent",
            "single_agent": "/single-agent"
        },
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "multi_agent": "running",
            "single_agent": "running"
        }
    }

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """请求日志中间件"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"请求: {request.method} {request.url.path} - 处理时间: {process_time:.4f}秒 - 状态码: {response.status_code}")
    return response

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """添加CORS头中间件"""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def signal_handler(sig, frame):
    """处理终止信号"""
    print("\n正在关闭服务...")
    sys.exit(0)

# 注册信号处理器
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def main():
    """主函数"""
    print("正在启动AI教育平台API服务...")
    
    # 设置知识库目录
    setup_knowledge_dirs()
    
    # 启动FastAPI应用
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()