package com.aiedu.platform.controller;

import com.aiedu.platform.model.ERole;
import com.aiedu.platform.model.Role;
import com.aiedu.platform.model.User;
import com.aiedu.platform.payload.request.LoginRequest;
import com.aiedu.platform.payload.request.SignupRequest;
import com.aiedu.platform.payload.response.JwtResponse;
import com.aiedu.platform.payload.response.MessageResponse;
import com.aiedu.platform.repository.RoleRepository;
import com.aiedu.platform.repository.UserRepository;
import com.aiedu.platform.security.jwt.JwtUtils;
import com.aiedu.platform.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 认证控制器，处理用户登录和注册
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    /**
     * 用户登录
     * @param loginRequest 登录请求
     * @return JWT响应
     */
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(),
                                                 userDetails.getUsername(),
                                                 userDetails.getEmail(),
                                                 roles));
    }

    /**
     * 用户注册
     * @param signUpRequest 注册请求
     * @return 消息响应
     */
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("错误: 用户名已被使用!"));
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("错误: 邮箱已被使用!"));
        }

        // 创建新用户
        User user = new User(signUpRequest.getUsername(),
                             signUpRequest.getEmail(),
                             encoder.encode(signUpRequest.getPassword()));

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        // 设置用户角色
        if (strRoles == null) {
            Role userRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElseThrow(() -> new RuntimeException("错误: 角色未找到."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("错误: 角色未找到."));
                        roles.add(adminRole);
                        break;
                    case "teacher":
                        Role teacherRole = roleRepository.findByName(ERole.ROLE_TEACHER)
                                .orElseThrow(() -> new RuntimeException("错误: 角色未找到."));
                        roles.add(teacherRole);
                        break;
                    default:
                        Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                                .orElseThrow(() -> new RuntimeException("错误: 角色未找到."));
                        roles.add(studentRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("用户注册成功!"));
    }
}