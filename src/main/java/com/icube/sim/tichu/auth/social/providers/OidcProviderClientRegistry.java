package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.auth.social.OidcProviderName;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OidcProviderClientRegistry {
    private final Map<OidcProviderName, OidcProviderClient> clients;

    public OidcProviderClientRegistry(List<OidcProviderClient> clients) {
        this.clients = clients.stream()
                .collect(Collectors.toMap(OidcProviderClient::provider, c -> c));
    }

    @PostConstruct
    public void validate() {
        var missing = EnumSet.allOf(OidcProviderName.class);
        missing.removeAll(clients.keySet());
        if (!missing.isEmpty()) {
            throw new IllegalStateException("No OidcProviderClient registered for: " + missing);
        }
    }

    public OidcProviderClient get(OidcProviderName provider) {
        var client = clients.get(provider);
        if (client == null) {
            throw new UnknownProviderException();
        }
        return client;
    }
}
