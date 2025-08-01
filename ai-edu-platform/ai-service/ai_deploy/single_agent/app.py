from fastapi import FastAPI, HTTPException, Request, Body, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import uuid
import time
import shutil
import logging
from datetime import datetime
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.document_loaders import TextLoader, DirectoryLoader, PyPDFLoader
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 从环境变量读取API密钥
api_key = os.getenv("MOONSHOT_API_KEY")
if not api_key:
    raise ValueError("环境变量 MOONSHOT_API_KEY 未设置！")

# 确保知识库目录存在
KNOWLEDGE_DIR = "knowledge"
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
os.makedirs(os.path.join(KNOWLEDGE_DIR, "uploads"), exist_ok=True)

# 创建FastAPI应用
app = FastAPI(title="AI教育单智能体系统", description="基于LangChain框架的单智能体系统，用于辅助教师生成教案和教学设计")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为特定的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class LessonPlanRequest(BaseModel):
    grade: str
    module: str
    knowledge_point: str
    duration: int
    preferences: List[str]
    custom_requirements: Optional[str] = None
    use_rag: bool = True
    user_id: Optional[str] = None

class LessonPlanResponse(BaseModel):
    id: str
    title: str
    grade: str
    module: str
    knowledge_point: str
    duration: int
    objectives: List[Dict[str, str]]
    key_points: List[str]
    difficult_points: List[str]
    resources: List[Dict[str, str]]
    teaching_process: List[Dict[str, Any]]
    evaluation: str
    extension: str
    created_at: str
    updated_at: Optional[str] = None
    user_id: Optional[str] = None

class QuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None
    use_rag: bool = True
    user_id: Optional[str] = None

class QuestionResponse(BaseModel):
    id: str
    question: str
    answer: str
    references: Optional[List[Dict[str, str]]] = None
    timestamp: str
    user_id: Optional[str] = None

class KnowledgeBaseUpload(BaseModel):
    name: str
    description: Optional[str] = None

# 内存存储（在实际应用中应该使用数据库）
lesson_plans = {}
qa_history = {}

# 初始化LangChain组件
callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

llm = ChatOpenAI(
    openai_api_key=api_key,
    openai_api_base="https://api.moonshot.cn/v1",
    model_name="kimi",
    temperature=0.7,
    callback_manager=callback_manager,
    streaming=True
)

# 加载知识库
def load_knowledge_base(index_name="default"):
    """加载和准备知识库"""
    try:
        # 检查知识库是否已经存在
        index_path = os.path.join(KNOWLEDGE_DIR, index_name)
        if os.path.exists(index_path):
            # 加载现有的知识库
            embeddings = OpenAIEmbeddings(
                openai_api_key=api_key,
                openai_api_base="https://api.moonshot.cn/v1"
            )
            knowledge_base = FAISS.load_local(index_path, embeddings)
            logger.info(f"已加载现有知识库: {index_path}")
            return knowledge_base
        
        # 创建新的知识库
        logger.info(f"创建新知识库: {index_path}")
        
        # 加载政策文档
        documents = [
            "《广东省中小学学生人工智能素养框架》四大维度包括：人智观念、技术实现、智能思维、伦理责任。",
            "《课程指导纲要》中强调'体验与认识、理解与应用、设计与创造'的学段目标递进原则。",
            "人工智能教育应遵循'全员普及与个性发展相结合'的课程理念。",
            "《广东省中小学教师人工智能素养框架》中强调'智能化教学设计'与'智能化资源开发'能力维度。",
            "《教育部办公厅关于加强中小学人工智能教育的通知》要求'规范、开发、利用好多样化的教学资源'。",
            "小学阶段（1-6年级）的人工智能教育应注重体验与认识，让学生了解人工智能的基本概念和应用。",
            "初中阶段（7-9年级）的人工智能教育应注重理解与应用，让学生掌握基本的人工智能技术和工具。",
            "人智观念维度强调理解人工智能的本质、发展历程和应用场景。",
            "技术实现维度强调掌握人工智能的基本原理、算法和工具。",
            "智能思维维度强调培养计算思维、数据思维和系统思维。",
            "伦理责任维度强调认识人工智能的社会影响，培养负责任的态度。"
        ]
        
        # 分割文本
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.create_documents(documents)
        
        # 创建嵌入和向量存储
        embeddings = OpenAIEmbeddings(
            openai_api_key=api_key,
            openai_api_base="https://api.moonshot.cn/v1"
        )
        knowledge_base = FAISS.from_documents(texts, embeddings)
        
        # 保存知识库
        knowledge_base.save_local(index_path)
        logger.info(f"知识库已保存到: {index_path}")
        
        return knowledge_base
    except Exception as e:
        logger.error(f"加载知识库时出错: {str(e)}")
        # 如果出错，返回None
        return None

# 尝试加载知识库
knowledge_base = load_knowledge_base()

# 创建教案生成链
lesson_plan_template = """
你是一位专业的人工智能教育专家，负责为教师生成高质量的教案。请根据以下信息生成一份详细的教案：

学段与年级: {grade}
课程模块: {module}
核心知识点: {knowledge_point}
课时: {duration}课时（每课时40分钟）
教学偏好: {preferences}
自定义要求: {custom_requirements}

请确保教案符合《广东省中小学教师人工智能素养框架》中的"智能化教学设计"与"智能化资源开发"能力维度，
以及《教育部办公厅关于加强中小学人工智能教育的通知》中"规范、开发、利用好多样化的教学资源"的要求。

教案应包含以下部分：
1. 教学目标（精准对标《学生人工智能素养框架》中的"人智观念"、"技术实现"、"智能思维"、"社会责任"四个维度）
2. 教学重难点
3. 教学资源建议
4. 教学过程设计（包括各个教学环节的时间分配、教学活动和教师提示）
5. 教学评价
6. 拓展建议

请以JSON格式输出，包含以下字段：
- title: 教案标题
- objectives: 教学目标列表，每个目标包含dimension（维度）和content（内容）
- key_points: 教学重点列表
- difficult_points: 教学难点列表
- resources: 教学资源列表，每个资源包含name（名称）、type（类型）和link（链接，可选）
- teaching_process: 教学过程列表，每个阶段包含name（名称）、duration（时长）、description（描述）和steps（步骤列表）
- evaluation: 教学评价
- extension: 拓展建议

{context}
"""

lesson_plan_prompt = PromptTemplate(
    input_variables=["grade", "module", "knowledge_point", "duration", "preferences", "custom_requirements", "context"],
    template=lesson_plan_template
)

lesson_plan_chain = LLMChain(
    llm=llm,
    prompt=lesson_plan_prompt
)

# 创建问答链
qa_template = """
你是一位专业的人工智能教育专家，负责回答教师关于人工智能教学的问题。
请根据以下信息回答问题：

问题: {question}
背景信息: {context}

请确保你的回答：
1. 符合《广东省中小学教师人工智能素养框架》和《课程指导纲要》的要求
2. 提供具体的教学案例和实践应用
3. 针对常见教学难题提供解决方案
4. 语言清晰易懂，适合教师理解和应用

如果你不确定答案，请诚实地说明，而不是提供可能不准确的信息。
"""

qa_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template=qa_template
)

qa_chain = LLMChain(
    llm=llm,
    prompt=qa_prompt
)

# API路由
@app.get("/")
async def root():
    return {"message": "AI教育单智能体系统API"}

@app.post("/lesson-plans", response_model=LessonPlanResponse)
async def generate_lesson_plan(request: LessonPlanRequest):
    """生成教案"""
    try:
        # 准备上下文
        context = ""
        if request.use_rag and knowledge_base:
            # 构建查询
            query = f"{request.grade} {request.module} {request.knowledge_point}"
            # 从知识库检索相关文档
            docs = knowledge_base.similarity_search(query, k=3)
            # 将检索到的文档添加到上下文
            context = "相关参考资料:\n" + "\n".join([doc.page_content for doc in docs])
            logger.info(f"已从知识库检索相关内容，长度: {len(context)}")
        
        # 准备输入
        preferences_str = ", ".join(request.preferences) if request.preferences else "无特殊偏好"
        custom_requirements_str = request.custom_requirements if request.custom_requirements else "无特殊要求"
        
        # 生成教案
        response = lesson_plan_chain.run(
            grade=request.grade,
            module=request.module,
            knowledge_point=request.knowledge_point,
            duration=request.duration,
            preferences=preferences_str,
            custom_requirements=custom_requirements_str,
            context=context
        )
        
        # 解析JSON响应
        try:
            lesson_plan_data = json.loads(response)
        except json.JSONDecodeError:
            # 如果响应不是有效的JSON，尝试提取JSON部分
            import re
            json_match = re.search(r'```json\n(.*?)\n```', response, re.DOTALL)
            if json_match:
                lesson_plan_data = json.loads(json_match.group(1))
            else:
                raise ValueError("无法解析生成的教案数据")
        
        # 创建教案记录
        lesson_plan_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        lesson_plan = {
            "id": lesson_plan_id,
            "title": lesson_plan_data.get("title", f"{request.grade} {request.knowledge_point} 教案"),
            "grade": request.grade,
            "module": request.module,
            "knowledge_point": request.knowledge_point,
            "duration": request.duration,
            "objectives": lesson_plan_data.get("objectives", []),
            "key_points": lesson_plan_data.get("key_points", []),
            "difficult_points": lesson_plan_data.get("difficult_points", []),
            "resources": lesson_plan_data.get("resources", []),
            "teaching_process": lesson_plan_data.get("teaching_process", []),
            "evaluation": lesson_plan_data.get("evaluation", ""),
            "extension": lesson_plan_data.get("extension", ""),
            "created_at": timestamp,
            "updated_at": None,
            "user_id": request.user_id
        }
        
        # 保存教案
        lesson_plans[lesson_plan_id] = lesson_plan
        
        return lesson_plan
    except Exception as e:
        logger.error(f"生成教案时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成教案失败: {str(e)}")

@app.get("/lesson-plans", response_model=List[LessonPlanResponse])
async def get_lesson_plans(user_id: Optional[str] = None):
    """获取所有教案"""
    if user_id:
        return [plan for plan in lesson_plans.values() if plan.get("user_id") == user_id]
    return list(lesson_plans.values())

@app.get("/lesson-plans/{lesson_plan_id}", response_model=LessonPlanResponse)
async def get_lesson_plan(lesson_plan_id: str):
    """获取特定教案的详情"""
    if lesson_plan_id not in lesson_plans:
        raise HTTPException(status_code=404, detail="教案不存在")
    
    return lesson_plans[lesson_plan_id]

@app.put("/lesson-plans/{lesson_plan_id}", response_model=LessonPlanResponse)
async def update_lesson_plan(lesson_plan_id: str, lesson_plan_data: dict = Body(...)):
    """更新教案"""
    if lesson_plan_id not in lesson_plans:
        raise HTTPException(status_code=404, detail="教案不存在")
    
    # 更新教案
    lesson_plan = lesson_plans[lesson_plan_id]
    
    for key, value in lesson_plan_data.items():
        if key in lesson_plan and key != "id" and key != "created_at":
            lesson_plan[key] = value
    
    # 更新时间戳
    lesson_plan["updated_at"] = datetime.now().isoformat()
    
    return lesson_plan

@app.delete("/lesson-plans/{lesson_plan_id}")
async def delete_lesson_plan(lesson_plan_id: str):
    """删除教案"""
    if lesson_plan_id not in lesson_plans:
        raise HTTPException(status_code=404, detail="教案不存在")
    
    # 删除教案
    del lesson_plans[lesson_plan_id]
    
    return {"message": "教案已删除"}

@app.post("/generate-lesson-plan", response_model=LessonPlanResponse)
async def generate_lesson_plan_endpoint(request: LessonPlanRequest):
    """生成教案的统一API端点"""
    return await generate_lesson_plan(request)

@app.post("/qa", response_model=QuestionResponse)
async def answer_question(request: QuestionRequest):
    """回答教学问题"""
    try:
        # 准备上下文
        context = request.context or ""
        references = []
        
        if request.use_rag and knowledge_base:
            # 从知识库检索相关文档
            docs = knowledge_base.similarity_search(request.question, k=3)
            
            # 将检索到的文档添加到上下文
            retrieved_context = "\n".join([doc.page_content for doc in docs])
            context = f"{context}\n\n检索到的相关信息:\n{retrieved_context}" if context else f"检索到的相关信息:\n{retrieved_context}"
            
            # 提取引用的参考资料
            for i, doc in enumerate(docs):
                references.append({
                    "id": f"ref_{i+1}",
                    "content": doc.page_content,
                    "relevance": "高" if i == 0 else "中" if i == 1 else "低"
                })
            
            logger.info(f"已从知识库检索相关内容，长度: {len(retrieved_context)}")
        
        # 生成回答
        answer = qa_chain.run(
            question=request.question,
            context=context
        )
        
        # 创建问答记录
        qa_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        qa_record = {
            "id": qa_id,
            "question": request.question,
            "answer": answer,
            "references": references,
            "timestamp": timestamp,
            "user_id": request.user_id
        }
        
        # 保存问答记录
        if "history" not in qa_history:
            qa_history["history"] = []
        
        qa_history["history"].append(qa_record)
        
        return qa_record
    except Exception as e:
        logger.error(f"回答问题时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"回答问题失败: {str(e)}")

@app.get("/qa/history", response_model=List[QuestionResponse])
async def get_qa_history(user_id: Optional[str] = None):
    """获取问答历史"""
    if "history" not in qa_history:
        return []
    
    if user_id:
        return [qa for qa in qa_history["history"] if qa.get("user_id") == user_id]
    return qa_history["history"]

@app.post("/knowledge/upload", status_code=201)
async def upload_knowledge(file: UploadFile = File(...), name: str = "custom", description: str = None):
    """上传知识库文件"""
    try:
        # 创建上传目录
        upload_dir = os.path.join(KNOWLEDGE_DIR, "uploads", name)
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 处理文件
        documents = []
        if file.filename.endswith(".pdf"):
            # 处理PDF文件
            loader = PyPDFLoader(file_path)
            documents = loader.load()
        elif file.filename.endswith(".txt"):
            # 处理文本文件
            loader = TextLoader(file_path)
            documents = loader.load()
        else:
            return {"error": "不支持的文件格式，目前仅支持PDF和TXT文件"}
        
        # 分割文本
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)
        
        # 创建嵌入和向量存储
        embeddings = OpenAIEmbeddings(
            openai_api_key=api_key,
            openai_api_base="https://api.moonshot.cn/v1"
        )
        
        # 检查是否已存在知识库
        index_path = os.path.join(KNOWLEDGE_DIR, name)
        if os.path.exists(index_path):
            # 加载现有知识库并添加新文档
            knowledge_base = FAISS.load_local(index_path, embeddings)
            knowledge_base.add_documents(texts)
        else:
            # 创建新的知识库
            knowledge_base = FAISS.from_documents(texts, embeddings)
        
        # 保存知识库
        knowledge_base.save_local(index_path)
        
        # 更新全局知识库
        global knowledge_base
        knowledge_base = FAISS.load_local(index_path, embeddings)
        
        return {
            "message": f"文件 {file.filename} 已成功上传并处理",
            "name": name,
            "description": description,
            "document_count": len(texts)
        }
    except Exception as e:
        logger.error(f"上传知识库文件时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传知识库文件失败: {str(e)}")

@app.get("/knowledge/list")
async def list_knowledge_bases():
    """列出所有知识库"""
    try:
        knowledge_bases = []
        for item in os.listdir(KNOWLEDGE_DIR):
            if os.path.isdir(os.path.join(KNOWLEDGE_DIR, item)) and item != "uploads":
                knowledge_bases.append({
                    "name": item,
                    "path": os.path.join(KNOWLEDGE_DIR, item)
                })
        return {"knowledge_bases": knowledge_bases}
    except Exception as e:
        logger.error(f"列出知识库时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"列出知识库失败: {str(e)}")

@app.post("/knowledge/query")
async def query_knowledge(query: str, top_k: int = 3):
    """查询知识库"""
    try:
        if not knowledge_base:
            raise HTTPException(status_code=404, detail="知识库未初始化")
        
        docs = knowledge_base.similarity_search(query, k=top_k)
        results = []
        
        for i, doc in enumerate(docs):
            results.append({
                "id": f"doc_{i+1}",
                "content": doc.page_content,
                "relevance": "高" if i == 0 else "中" if i == 1 else "低"
            })
        
        return {"results": results}
    except Exception as e:
        logger.error(f"查询知识库时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"查询知识库失败: {str(e)}")

@app.post("/lesson-plans/export/{lesson_plan_id}")
async def export_lesson_plan(lesson_plan_id: str, format: str = "json"):
    """导出教案为不同格式"""
    if lesson_plan_id not in lesson_plans:
        raise HTTPException(status_code=404, detail="教案不存在")
    
    lesson_plan = lesson_plans[lesson_plan_id]
    
    if format == "json":
        # 导出为JSON
        return lesson_plan
    elif format == "markdown":
        # 导出为Markdown
        markdown_content = f"""# {lesson_plan['title']}

## 基本信息
- 年级: {lesson_plan['grade']}
- 课程模块: {lesson_plan['module']}
- 核心知识点: {lesson_plan['knowledge_point']}
- 课时: {lesson_plan['duration']}课时

## 教学目标
"""
        for obj in lesson_plan['objectives']:
            markdown_content += f"- **{obj['dimension']}**: {obj['content']}\n"
        
        markdown_content += "\n## 教学重点\n"
        for point in lesson_plan['key_points']:
            markdown_content += f"- {point}\n"
        
        markdown_content += "\n## 教学难点\n"
        for point in lesson_plan['difficult_points']:
            markdown_content += f"- {point}\n"
        
        markdown_content += "\n## 教学资源\n"
        for resource in lesson_plan['resources']:
            if 'link' in resource and resource['link']:
                markdown_content += f"- [{resource['name']}]({resource['link']}) ({resource['type']})\n"
            else:
                markdown_content += f"- {resource['name']} ({resource['type']})\n"
        
        markdown_content += "\n## 教学过程\n"
        for process in lesson_plan['teaching_process']:
            markdown_content += f"### {process['name']} ({process['duration']})\n\n"
            markdown_content += f"{process['description']}\n\n"
            markdown_content += "步骤:\n"
            for i, step in enumerate(process.get('steps', [])):
                markdown_content += f"{i+1}. {step}\n"
            markdown_content += "\n"
        
        markdown_content += f"\n## 教学评价\n{lesson_plan['evaluation']}\n"
        markdown_content += f"\n## 拓展建议\n{lesson_plan['extension']}\n"
        
        return StreamingResponse(
            iter([markdown_content.encode()]),
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename={lesson_plan_id}.md"}
        )
    else:
        raise HTTPException(status_code=400, detail="不支持的导出格式")

# 启动服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)