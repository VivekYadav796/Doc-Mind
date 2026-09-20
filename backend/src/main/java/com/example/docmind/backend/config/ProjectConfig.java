package com.example.docmind.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjectConfig {

    @Bean
    public OpenAPI docMindOpenAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("DocMind API")
                        .description("""
                                REST API for DocMind.

                                DocMind allows users to upload documents,
                                process PDFs, generate embeddings, store
                                document chunks in PGVector, and ask
                                questions using Gemini and RAG.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DocMind Team"))
                        .license(new License()
                                .name("Apache 2.0")));
    }
}

