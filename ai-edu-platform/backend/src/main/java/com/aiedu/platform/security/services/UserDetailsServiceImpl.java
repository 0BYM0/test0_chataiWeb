package com.aiedu.platform.security.services;

import com.aiedu.platform.model.User;
import com.aiedu.platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户详情服务实现类，用于加载用户信息
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    /**
     * 根据用户名加载用户信息
     * @param username 用户名
     * @return 用户详情
     * @throws UsernameNotFoundException 用户不存在异常
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("未找到用户: " + username));

        return UserDetailsImpl.build(user);
    }
}