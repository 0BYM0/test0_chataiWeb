package com.aiedu.platform.repository;

import com.aiedu.platform.model.ERole;
import com.aiedu.platform.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 角色仓库接口，用于操作角色数据
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    /**
     * 根据角色名查找角色
     * @param name 角色名
     * @return 角色对象
     */
    Optional<Role> findByName(ERole name);
}