package com.icube.sim.tichu.auth.social;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserIdentityRepository extends JpaRepository<UserIdentity, Long> {
    Optional<UserIdentity> findByProviderAndProviderSubject(SocialAuthProviderName provider, String providerSubject);

    List<UserIdentity> findAllByUserId(Long userId);

    @Query("SELECT COUNT(ui) FROM UserIdentity ui WHERE ui.user.id = :userId AND ui.provider != :provider")
    long countByUserIdAndProviderNot(@Param("userId") Long userId, @Param("provider") SocialAuthProviderName provider);

    @Transactional
    @Modifying
    @Query("DELETE FROM UserIdentity ui WHERE ui.user.id = :userId AND ui.provider = :provider")
    void deleteByUserIdAndProvider(@Param("userId") Long userId, @Param("provider") SocialAuthProviderName provider);
}
