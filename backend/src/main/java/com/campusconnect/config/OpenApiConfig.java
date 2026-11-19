package com.campusconnect.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI orbitlyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Orbitly REST API")
                        .version("1.0.0")
                        .description("Comprehensive REST API documentation for Orbitly — a verified social discovery, " +
                                "networking, and authentic connections platform. Includes Instagram DM identity verification, " +
                                "Meta Webhook event processing, user discovery, connection requests, and real-time private messaging.")
                        .contact(new Contact()
                                .name("Orbitly Engineering Team")
                                .email("dev@orbitly.app"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ))
                .tags(List.of(
                        new Tag().name("Authentication & Instagram Verification").description("Endpoints for one-time DM challenge issuance, status polling, code resend, and JWT session issuance"),
                        new Tag().name("Users").description("Student profiles, directory search, and registration endpoints"),
                        new Tag().name("Connections & Messaging").description("Connection requests, mutual approvals, and private one-on-one chat messaging"),
                        new Tag().name("Campus Moments (Feed)").description("Campus story posts, multimedia wall, and interaction likes"),
                        new Tag().name("Admin & Follower Reconciliation").description("Bulk follower JSON export parsing, handle reconciliation, and audit logs"),
                        new Tag().name("Instagram Webhooks").description("Meta Webhook verification handshake and live message ingestion callbacks")
                ))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Bearer token issued upon successful Instagram verification login. Enter your token below.")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}
