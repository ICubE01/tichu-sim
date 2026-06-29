package com.icube.sim.tichu.auth.social;

import com.icube.sim.tichu.users.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

import static jakarta.persistence.EnumType.STRING;

@Getter
@Setter
@Entity
@Table(name = "user_identities", schema = "tichu")
public class UserIdentity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Enumerated(STRING)
    @Column(name = "provider", nullable = false)
    private SocialAuthProviderName provider;

    @NotNull
    @Column(name = "provider_subject", nullable = false)
    private String providerSubject;

    @Column(name = "provider_email")
    private String providerEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
