package com.example.docmind.backend.dto;

import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunkDto {
    private String id;
    private UUID documentId;
    private Integer chunkIndex;
    private Integer pageNumber;
    private String snippet;
    private Map<String, Object> metadata;
}
