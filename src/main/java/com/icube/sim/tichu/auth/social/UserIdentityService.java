package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.users.User;
import com.icube.sim.tichu.users.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Service
public class UserIdentityService {
    private final UserRepository userRepository;
    private final UserIdentityRepository userIdentityRepository;

    @Transactional(readOnly = true)
    public List<UserIdentityDto> getIdentities(Long userId) {
        return userIdentityRepository.findAllByUserId(userId).stream()
                .map(i -> new UserIdentityDto(i.getProvider(), i.getProviderEmail(), i.getCreatedAt()))
                .toList();
    }

    @Transactional
    public FindOrCreateResult findOrCreateUser(SocialAuthProviderName provider, OidcIdToken idToken) {
        var identity = userIdentityRepository.findByProviderAndProviderSubject(provider, idToken.getSubject());
        if (identity.isPresent()) {
            return new FindOrCreateResult(identity.get().getUser(), false);
        }

        User user;
        if (userRepository.existsByEmail(idToken.getEmail())) {
            throw new EmailConflictException();
        }
        try {
            user = createUser(idToken.getEmail(), getName(idToken));
        } catch (DataIntegrityViolationException e) {
            throw new EmailConflictException();
        }
        try {
            createIdentity(user, provider, idToken.getSubject(), idToken.getEmail());
        } catch (DataIntegrityViolationException e) {
            throw new IdentityConflictException();
        }

        return new FindOrCreateResult(user, true);
    }

    @Transactional
    public void connectIdentity(Long userId, SocialAuthProviderName provider, OidcIdToken idToken) {
        userIdentityRepository.findByProviderAndProviderSubject(provider, idToken.getSubject())
                .ifPresent(existing -> {
                    if (existing.getUser().getId().equals(userId)) {
                        throw new ProviderAlreadyConnectedException();
                    }
                    throw new IdentityConflictException();
                });

        var user = userRepository.findById(userId).orElseThrow();
        try {
            createIdentity(user, provider, idToken.getSubject(), idToken.getEmail());
        } catch (DataIntegrityViolationException e) {
            throw new IdentityConflictException();
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void disconnectIdentity(Long userId, SocialAuthProviderName provider) {
        var user = userRepository.findById(userId).orElseThrow();
        var hasPassword = user.getPassword() != null;
        var otherIdentities = userIdentityRepository.countByUserIdAndProviderNot(userId, provider);
        if (!hasPassword && otherIdentities == 0) {
            throw new LastLoginMethodException();
        }
        userIdentityRepository.deleteByUserIdAndProvider(userId, provider);
    }

    private User createUser(String email, String name) {
        var user = new User();
        user.setEmail(email);
        user.setName(name);
        return userRepository.save(user);
    }

    private void createIdentity(User user, SocialAuthProviderName provider, String subject, String email) {
        var identity = new UserIdentity();
        identity.setUser(user);
        identity.setProvider(provider);
        identity.setProviderSubject(subject);
        identity.setProviderEmail(email);
        userIdentityRepository.save(identity);
    }

    private static String getName(OidcIdToken idToken) {
        var name = idToken.getNickName();
        if (name == null || name.isBlank()) {
            name = idToken.getGivenName();
        }
        if (name == null || name.isBlank()) {
            name = idToken.getEmail().split("@")[0];
        }
        return name;
    }
}
