import { defineStore } from 'pinia'
import { classroomAPI } from '../services/api'

// 班级状态管理
export const useClassroomStore = defineStore('classroom', {
  state: () => ({
    // 班级列表
    classrooms: [],
    // 当前班级
    currentClassroom: null,
    // 是否正在加载
    isLoading: false,
    // 错误信息
    error: null
  }),
  
  getters: {
    // 获取班级列表
    getClassrooms: (state) => state.classrooms,
    
    // 获取当前班级
    getCurrentClassroom: (state) => state.currentClassroom,
    
    // 获取当前班级的学生列表
    getCurrentClassroomStudents: (state) => {
      if (!state.currentClassroom) return []
      return state.currentClassroom.students || []
    },
    
    // 判断是否正在处理
    isProcessing: (state) => state.isLoading
  },
  
  actions: {
    // 获取班级列表
    async fetchClassrooms() {
      try {
        this.isLoading = true
        
        // 调用API获取班级列表
        const response = await classroomAPI.getClassrooms()
        
        this.classrooms = response.data
        
        return this.classrooms
      } catch (error) {
        console.error('获取班级列表失败:', error)
        this.error = error.response?.data?.message || '获取班级列表失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 获取班级详情
    async fetchClassroom(classroomId) {
      try {
        this.isLoading = true
        
        // 调用API获取班级详情
        const response = await classroomAPI.getClassroom(classroomId)
        
        this.currentClassroom = response.data
        
        return this.currentClassroom
      } catch (error) {
        console.error('获取班级详情失败:', error)
        this.error = error.response?.data?.message || '获取班级详情失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 创建班级
    async createClassroom(classroom) {
      try {
        this.isLoading = true
        
        // 调用API创建班级
        const response = await classroomAPI.createClassroom(classroom)
        
        const newClassroom = response.data
        
        // 更新状态
        this.classrooms.push(newClassroom)
        
        return newClassroom
      } catch (error) {
        console.error('创建班级失败:', error)
        this.error = error.response?.data?.message || '创建班级失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 更新班级
    async updateClassroom(classroomId, classroom) {
      try {
        this.isLoading = true
        
        // 调用API更新班级
        const response = await classroomAPI.updateClassroom(classroomId, classroom)
        
        const updatedClassroom = response.data
        
        // 更新状态
        const index = this.classrooms.findIndex(c => c.id === classroomId)
        if (index !== -1) {
          this.classrooms[index] = updatedClassroom
        }
        
        if (this.currentClassroom && this.currentClassroom.id === classroomId) {
          this.currentClassroom = updatedClassroom
        }
        
        return updatedClassroom
      } catch (error) {
        console.error('更新班级失败:', error)
        this.error = error.response?.data?.message || '更新班级失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 删除班级
    async deleteClassroom(classroomId) {
      try {
        this.isLoading = true
        
        // 调用API删除班级
        await classroomAPI.deleteClassroom(classroomId)
        
        // 更新状态
        this.classrooms = this.classrooms.filter(c => c.id !== classroomId)
        
        if (this.currentClassroom && this.currentClassroom.id === classroomId) {
          this.currentClassroom = null
        }
        
        return { success: true }
      } catch (error) {
        console.error('删除班级失败:', error)
        this.error = error.response?.data?.message || '删除班级失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 添加学生到班级
    async addStudentToClassroom(classroomId, studentId) {
      try {
        this.isLoading = true
        
        // 调用API添加学生到班级
        const response = await classroomAPI.addStudentToClassroom(classroomId, studentId)
        
        // 如果当前班级是被修改的班级，更新学生列表
        if (this.currentClassroom && this.currentClassroom.id === classroomId) {
          this.currentClassroom = response.data
        }
        
        return response.data
      } catch (error) {
        console.error('添加学生到班级失败:', error)
        this.error = error.response?.data?.message || '添加学生到班级失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 从班级移除学生
    async removeStudentFromClassroom(classroomId, studentId) {
      try {
        this.isLoading = true
        
        // 调用API从班级移除学生
        const response = await classroomAPI.removeStudentFromClassroom(classroomId, studentId)
        
        // 如果当前班级是被修改的班级，更新学生列表
        if (this.currentClassroom && this.currentClassroom.id === classroomId) {
          this.currentClassroom = response.data
        }
        
        return response.data
      } catch (error) {
        console.error('从班级移除学生失败:', error)
        this.error = error.response?.data?.message || '从班级移除学生失败'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    // 清空当前班级
    clearCurrentClassroom() {
      this.currentClassroom = null
    },
    
    // 清空错误信息
    clearError() {
      this.error = null
    }
  }
})