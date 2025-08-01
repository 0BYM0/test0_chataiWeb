package com.aiedu.platform.security.jwt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * JWT认证入口点，处理未认证的请求
 */
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    /**
     * 当用户尝试访问安全资源而未通过认证时调用
     * @param request 请求
     * @param response 响应
     * @param authException 认证异常
     * @throws IOException IO异常
     * @throws ServletException Servlet异常
     */
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        logger.error("未授权错误: {}", authException.getMessage());
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().println("{ \"error\": \"未授权\", \"message\": \"" + authException.getMessage() + "\" }");
    }
}