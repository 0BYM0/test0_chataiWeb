from fastapi import FastAPI, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import uuid
import time
import asyncio
from datetime import datetime
import autogen
from openai import OpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.document_loaders import TextLoader, DirectoryLoader, PyPDFLoader
import shutil
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 从环境变量读取API密钥
api_key = os.getenv("MOONSHOT_API_KEY")
if not api_key:
    raise ValueError("环境变量 MOONSHOT_API_KEY 未设置！")

# 创建OpenAI客户端
client = OpenAI(
    api_key=api_key,
    base_url="https://api.moonshot.cn/v1"
)

# 确保知识库目录存在
KNOWLEDGE_DIR = "knowledge"
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
os.makedirs(os.path.join(KNOWLEDGE_DIR, "uploads"), exist_ok=True)

# 创建FastAPI应用
app = FastAPI(title="AI教育多智能体系统", description="基于AutoGen框架的多智能体系统，用于辅助学生学习人工智能知识")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为特定的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None
    use_rag: bool = True

class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    agent_role: str
    references: Optional[List[Dict[str, Any]]] = None

class ConversationCreate(BaseModel):
    conversation_type: str
    user_id: str
    user_role: str = "student"
    initial_message: Optional[str] = None
    use_rag: bool = True

class MessageCreate(BaseModel):
    content: str
    agent_role: str
    use_rag: bool = True

class ConversationResponse(BaseModel):
    id: str
    conversation_type: str
    user_id: str
    user_role: str
    start_time: str
    agent_roles_involved: List[str]
    title: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    content: str
    sender_type: str
    sender_role: str
    receiver_type: str
    receiver_role: str
    timestamp: str
    message_order: int
    references: Optional[List[Dict[str, str]]] = None

class KnowledgeBaseUpload(BaseModel):
    name: str
    description: Optional[str] = None

# 内存存储（在实际应用中应该使用数据库）
conversations = {}
messages = {}

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

# 智能体配置
def create_agents(conversation_type, user_role, use_rag=True, query=None):
    """
    根据对话类型和用户角色创建相应的智能体组
    """
    # 配置LLM
    config_list = [
        {
            "model": "kimi",
            "api_key": api_key,
            "base_url": "https://api.moonshot.cn/v1",
        }
    ]
    
    # 准备RAG上下文
    rag_context = ""
    if use_rag and knowledge_base and query:
        try:
            # 从知识库检索相关文档
            docs = knowledge_base.similarity_search(query, k=3)
            # 将检索到的文档添加到上下文
            rag_context = "\n\n参考资料:\n" + "\n".join([doc.page_content for doc in docs])
            logger.info(f"已从知识库检索相关内容，长度: {len(rag_context)}")
        except Exception as e:
            logger.error(f"检索知识库时出错: {str(e)}")
    
    # 创建智能体
    if conversation_type == "student_self_study":
        # 创建专家智能体
        expert_system_message = f"""你是一位人工智能教育专家，负责制定学习目标和评估标准。
        你的职责包括：
        1. 根据学生的学习历史和能力水平，动态调整任务的难度和评价维度
        2. 将专业的考核标准转化为学生能理解的、可自评的学习评估量规
        3. 确保学习目标符合《广东省中小学学生人工智能素养框架》的四大维度：人智观念、技术实现、智能思维、伦理责任
        
        你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
        
        {rag_context}
        """
        
        expert_agent = autogen.AssistantAgent(
            name="专家智能体",
            system_message=expert_system_message,
            llm_config={"config_list": config_list}
        )
        
        # 创建助教智能体
        assistant_system_message = f"""你是一位人工智能教育助教，负责提供学习资源和任务指导。
        你的职责包括：
        1. 提供多元化的学习资源，包括文本资源、不插电活动、在线模拟器或教学视频
        2. 将复杂的任务分解为2-3个清晰的子步骤，提供清晰的行动路线图
        3. 基于专家智能体制定的量规，逐条进行评价，给予有据可依的反馈
        4. 提出启发式问题，如："你觉得在这一步，除了用循环，还有没有更简洁的方法来实现？"引导同伴智能体（和学习者）进行深度思考
        
        你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
        
        {rag_context}
        """
        
        assistant_agent = autogen.AssistantAgent(
            name="助教智能体",
            system_message=assistant_system_message,
            llm_config={"config_list": config_list}
        )
        
        # 创建同伴智能体
        peer_system_message = f"""你是一位人工智能学习同伴，与学生一起学习人工智能知识。
        你的职责包括：
        1. 在完成任务时，展示你的思考过程，让学生了解问题解决的思路
        2. 故意犯一些初学者典型的错误，然后进行自我修正，帮助学生理解常见错误和解决方法
        3. 以平等的姿态与学生交流，营造轻松友好的学习氛围
        
        你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
        
        {rag_context}
        """
        
        peer_agent = autogen.AssistantAgent(
            name="同伴智能体",
            system_message=peer_system_message,
            llm_config={"config_list": config_list}
        )
        
        # 创建用户代理
        user_proxy = autogen.UserProxyAgent(
            name="学习者",
            human_input_mode="NEVER",
            system_message="你是学习活动的发起者和最终实践者。"
        )
        
        # 创建群聊管理器
        group_chat = autogen.GroupChat(
            agents=[expert_agent, assistant_agent, peer_agent, user_proxy],
            messages=[],
            max_round=50
        )
        
        manager = autogen.GroupChatManager(
            groupchat=group_chat,
            llm_config={"config_list": config_list}
        )
        
        return {
            "expert": expert_agent,
            "assistant": assistant_agent,
            "peer": peer_agent,
            "user_proxy": user_proxy,
            "manager": manager,
            "group_chat": group_chat
        }
    
    # 可以添加其他类型的对话配置
    
    # 默认返回助教智能体
    assistant_system_message = f"""你是一位人工智能教育助教，负责回答学生的问题并提供学习指导。
    你应该根据学生的问题和需求，提供清晰、准确、有针对性的回答和指导。
    你的回答应该符合《广东省中小学学生人工智能素养框架》的要求，涵盖人智观念、技术实现、智能思维和伦理责任四个维度。
    
    {rag_context}
    """
    
    return {
        "assistant": autogen.AssistantAgent(
            name="助教智能体",
            system_message=assistant_system_message,
            llm_config={"config_list": config_list}
        )
    }

# API路由
@app.get("/")
async def root():
    return {"message": "AI教育多智能体系统API"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """处理聊天请求"""
    try:
        # 如果没有提供conversation_id，创建新的对话
        conversation_id = request.conversation_id
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            # 创建新的对话记录
            conversations[conversation_id] = {
                "id": conversation_id,
                "conversation_type": "student_self_study",
                "user_id": "anonymous",
                "user_role": "student",
                "start_time": datetime.now().isoformat(),
                "agent_roles_involved": ["assistant", "expert", "peer"],
                "title": None,
                "use_rag": request.use_rag
            }
            messages[conversation_id] = []
        
        # 准备RAG上下文和引用
        rag_context = ""
        references = []
        if request.use_rag and knowledge_base:
            try:
                # 从知识库检索相关文档
                docs = knowledge_base.similarity_search(request.message, k=3)
                
                # 将检索到的文档添加到上下文和引用
                rag_context = "\n\n参考资料:\n" + "\n".join([doc.page_content for doc in docs])
                
                for i, doc in enumerate(docs):
                    references.append({
                        "id": f"ref_{i+1}",
                        "content": doc.page_content,
                        "relevance": "高" if i == 0 else "中" if i == 1 else "低"
                    })
                
                logger.info(f"已从知识库检索相关内容，长度: {len(rag_context)}")
            except Exception as e:
                logger.error(f"检索知识库时出错: {str(e)}")
        
        # 准备历史消息
        history = []
        if request.history:
            history = request.history
        elif conversation_id in messages:
            for msg in messages[conversation_id]:
                if msg["sender_type"] == "user":
                    history.append({"role": "user", "content": msg["content"]})
                else:
                    history.append({"role": "assistant", "content": msg["content"]})
        
        # 随机选择一个智能体角色
        import random
        agent_roles = ["assistant", "expert", "peer"]
        agent_role = random.choice(agent_roles)
        
        # 准备系统消息
        system_message = ""
        if agent_role == "assistant":
            system_message = f"""你是一位人工智能教育助教，负责提供学习资源和任务指导。
            你的职责包括：
            1. 提供多元化的学习资源，包括文本资源、不插电活动、在线模拟器或教学视频
            2. 将复杂的任务分解为2-3个清晰的子步骤，提供清晰的行动路线图
            3. 基于专家智能体制定的量规，逐条进行评价，给予有据可依的反馈
            4. 提出启发式问题，引导学生进行深度思考
            
            你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
            """
        elif agent_role == "expert":
            system_message = f"""你是一位人工智能教育专家，负责制定学习目标和评估标准。
            你的职责包括：
            1. 根据学生的学习历史和能力水平，动态调整任务的难度和评价维度
            2. 将专业的考核标准转化为学生能理解的、可自评的学习评估量规
            3. 确保学习目标符合《广东省中小学学生人工智能素养框架》的四大维度：人智观念、技术实现、智能思维、伦理责任
            
            你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
            """
        else:  # peer
            system_message = f"""你是一位人工智能学习同伴，与学生一起学习人工智能知识。
            你的职责包括：
            1. 在完成任务时，展示你的思考过程，让学生了解问题解决的思路
            2. 故意犯一些初学者典型的错误，然后进行自我修正，帮助学生理解常见错误和解决方法
            3. 以平等的姿态与学生交流，营造轻松友好的学习氛围
            
            你的回答风格应该是苏格拉底式的，通过提问引导学生思考，而不是直接给出答案。
            """
        
        # 添加RAG上下文
        if rag_context:
            system_message = f"{system_message}\n\n{rag_context}"
        
        # 准备消息历史
        messages_for_api = [{"role": "system", "content": system_message}]
        
        # 添加历史消息（最多5条，以避免超出上下文限制）
        if history:
            for msg in history[-5:]:
                messages_for_api.append(msg)
        
        # 添加当前用户消息
        messages_for_api.append({"role": "user", "content": request.message})
        
        # 调用API生成回复
        response = client.chat.completions.create(
            model="kimi",
            messages=messages_for_api
        )
        response_content = response.choices[0].message.content
        
        # 保存消息
        timestamp = datetime.now().isoformat()
        
        # 保存用户消息
        user_message_id = str(uuid.uuid4())
        user_message = {
            "id": user_message_id,
            "conversation_id": conversation_id,
            "content": request.message,
            "sender_type": "user",
            "sender_role": "student",
            "receiver_type": "agent",
            "receiver_role": agent_role,
            "timestamp": timestamp,
            "message_order": len(messages[conversation_id]) + 1 if conversation_id in messages else 1,
            "references": []
        }
        
        if conversation_id not in messages:
            messages[conversation_id] = []
        
        messages[conversation_id].append(user_message)
        
        # 保存智能体回复
        agent_message_id = str(uuid.uuid4())
        agent_message = {
            "id": agent_message_id,
            "conversation_id": conversation_id,
            "content": response_content,
            "sender_type": "agent",
            "sender_role": agent_role,
            "receiver_type": "user",
            "receiver_role": "student",
            "timestamp": datetime.now().isoformat(),
            "message_order": len(messages[conversation_id]) + 1,
            "references": references
        }
        
        messages[conversation_id].append(agent_message)
        
        # 返回响应
        return {
            "conversation_id": conversation_id,
            "response": response_content,
            "agent_role": agent_role,
            "references": references
        }
    except Exception as e:
        logger.error(f"处理聊天请求时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理聊天请求失败: {str(e)}")

@app.post("/conversations", response_model=ConversationResponse)
async def create_conversation(conversation_data: ConversationCreate):
    """创建新的对话"""
    conversation_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    # 创建智能体
    agents = create_agents(
        conversation_data.conversation_type, 
        conversation_data.user_role,
        conversation_data.use_rag,
        conversation_data.initial_message
    )
    
    # 确定涉及的智能体角色
    agent_roles = list(agents.keys())
    if "user_proxy" in agent_roles:
        agent_roles.remove("user_proxy")
    if "manager" in agent_roles:
        agent_roles.remove("manager")
    if "group_chat" in agent_roles:
        agent_roles.remove("group_chat")
    
    # 创建对话记录
    conversation = {
        "id": conversation_id,
        "conversation_type": conversation_data.conversation_type,
        "user_id": conversation_data.user_id,
        "user_role": conversation_data.user_role,
        "start_time": timestamp,
        "agent_roles_involved": agent_roles,
        "agents": agents,  # 存储智能体实例
        "title": None,
        "use_rag": conversation_data.use_rag
    }
    
    conversations[conversation_id] = conversation
    
    # 如果有初始消息，添加到消息列表
    if conversation_data.initial_message:
        message_id = str(uuid.uuid4())
        message = {
            "id": message_id,
            "conversation_id": conversation_id,
            "content": conversation_data.initial_message,
            "sender_type": "user",
            "sender_role": conversation_data.user_role,
            "receiver_type": "agent",
            "receiver_role": agent_roles[0] if agent_roles else "assistant",
            "timestamp": timestamp,
            "message_order": 1,
            "references": []
        }
        
        if conversation_id not in messages:
            messages[conversation_id] = []
        
        messages[conversation_id].append(message)
    
    # 返回对话信息（不包括智能体实例）
    return {
        "id": conversation_id,
        "conversation_type": conversation_data.conversation_type,
        "user_id": conversation_data.user_id,
        "user_role": conversation_data.user_role,
        "start_time": timestamp,
        "agent_roles_involved": agent_roles,
        "title": None
    }

@app.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(user_id: str = None):
    """获取对话列表"""
    result = []
    
    for conv_id, conv in conversations.items():
        if user_id is None or conv["user_id"] == user_id:
            # 创建不包含智能体实例的对话记录
            conversation_data = {
                "id": conv["id"],
                "conversation_type": conv["conversation_type"],
                "user_id": conv["user_id"],
                "user_role": conv["user_role"],
                "start_time": conv["start_time"],
                "agent_roles_involved": conv["agent_roles_involved"],
                "title": conv["title"]
            }
            result.append(conversation_data)
    
    return result

@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """获取特定对话的详情"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    conv = conversations[conversation_id]
    
    # 创建不包含智能体实例的对话记录
    return {
        "id": conv["id"],
        "conversation_type": conv["conversation_type"],
        "user_id": conv["user_id"],
        "user_role": conv["user_role"],
        "start_time": conv["start_time"],
        "agent_roles_involved": conv["agent_roles_involved"],
        "title": conv["title"]
    }

@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(conversation_id: str, message_data: MessageCreate):
    """在特定对话中创建新消息"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    conv = conversations[conversation_id]
    timestamp = datetime.now().isoformat()
    
    # 获取消息顺序
    message_order = 1
    if conversation_id in messages and messages[conversation_id]:
        message_order = len(messages[conversation_id]) + 1
    
    # 创建用户消息
    user_message_id = str(uuid.uuid4())
    user_message = {
        "id": user_message_id,
        "conversation_id": conversation_id,
        "content": message_data.content,
        "sender_type": "user",
        "sender_role": conv["user_role"],
        "receiver_type": "agent",
        "receiver_role": message_data.agent_role,
        "timestamp": timestamp,
        "message_order": message_order,
        "references": []
    }
    
    if conversation_id not in messages:
        messages[conversation_id] = []
    
    messages[conversation_id].append(user_message)
    
    # 使用智能体生成回复
    agents = conv["agents"]
    response_content = ""
    references = []
    
    try:
        # 如果启用RAG，从知识库检索相关内容
        rag_context = ""
        if message_data.use_rag and knowledge_base:
            try:
                # 从知识库检索相关文档
                docs = knowledge_base.similarity_search(message_data.content, k=3)
                
                # 将检索到的文档添加到上下文和引用
                rag_context = "\n\n参考资料:\n" + "\n".join([doc.page_content for doc in docs])
                
                for i, doc in enumerate(docs):
                    references.append({
                        "id": f"ref_{i+1}",
                        "content": doc.page_content,
                        "relevance": "高" if i == 0 else "中" if i == 1 else "低"
                    })
                
                logger.info(f"已从知识库检索相关内容，长度: {len(rag_context)}")
            except Exception as e:
                logger.error(f"检索知识库时出错: {str(e)}")
        
        if message_data.agent_role in agents:
            agent = agents[message_data.agent_role]
            
            # 使用智能体生成回复
            if isinstance(agent, autogen.AssistantAgent):
                # 准备系统消息
                system_message = agent.system_message
                if rag_context:
                    system_message = f"{system_message}\n\n{rag_context}"
                
                # 直接使用智能体的LLM配置生成回复
                response = client.chat.completions.create(
                    model="kimi",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": message_data.content}
                    ]
                )
                response_content = response.choices[0].message.content
            else:
                # 默认回复
                response_content = "我是AI助手，很高兴为您提供帮助。"
        else:
            # 如果指定的智能体不存在，使用默认回复
            response_content = "抱歉，您请求的智能体不可用。请尝试与其他智能体对话。"
    except Exception as e:
        logger.error(f"生成回复时出错: {str(e)}")
        response_content = "抱歉，生成回复时出现错误。请稍后再试。"
    
    # 创建智能体回复消息
    agent_message_id = str(uuid.uuid4())
    agent_message = {
        "id": agent_message_id,
        "conversation_id": conversation_id,
        "content": response_content,
        "sender_type": "agent",
        "sender_role": message_data.agent_role,
        "receiver_type": "user",
        "receiver_role": conv["user_role"],
        "timestamp": datetime.now().isoformat(),
        "message_order": message_order + 1,
        "references": references
    }
    
    messages[conversation_id].append(agent_message)
    
    # 返回智能体的回复消息
    return agent_message

@app.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(conversation_id: str):
    """获取特定对话的所有消息"""
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    if conversation_id not in messages:
        return []
    
    return messages[conversation_id]

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

# 启动服务器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
