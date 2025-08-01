# 使用官方的 OpenJDK 11 JRE 精简版作为基础镜像
FROM openjdk:11-jre-slim

# 设置工作目录
WORKDIR /app

# 将构建好的 JAR 文件复制到容器中，并重命名为 app.jar
# 'target/*.jar' 可以匹配到你的 JAR 文件，例如 platform-0.0.1-SNAPSHOT.jar
COPY target/*.jar app.jar

# 暴露应用程序的端口
EXPOSE 8080

# 设置容器启动时执行的命令
# 我们将通过环境变量来激活 'cloud' 配置
ENTRYPOINT ["java", "-jar", "app.jar"]