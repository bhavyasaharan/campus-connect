package com.campusconnect.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "meta.instagram")
@Data
public class MetaInstagramProperties {

    private String appId;
    private String appSecret;
    private String accessToken;
    private String accountId;
    private String webhookVerifyToken;
    private String apiVersion = "v21.0";
    private String communityAccount = "campus_connect_official";
    private boolean devMode = true;
}
