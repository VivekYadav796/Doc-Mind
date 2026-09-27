package com.example.docmind.backend.service;

import com.example.docmind.backend.dto.DocumentChunkDto;
import com.example.docmind.backend.dto.DocumentMetadataDto;
import com.example.docmind.backend.dto.DocumentResponseDto;
import com.example.docmind.backend.entity.DocumentMetadata;
import com.example.docmind.backend.entity.DocumentStatus;
import com.example.docmind.backend.exception.DocumentProcessingException;
import com.example.docmind.backend.exception.ResourceNotFoundException;
import com.example.docmind.backend.repository.DocumentMetadataRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentMetadataService {

    private static final Logger log = LoggerFactory.getLogger(DocumentMetadataService.class);

    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentParserService parserService;
    private final DocumentIngestionService ingestionService;
    private final ModelMapper modelMapper;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    // method to upload and parse document
    @Transactional
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octat-stream";

        // document meta data create
        DocumentMetadata documentMetadata = DocumentMetadata
                .builder()
                .filename(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .build();

        documentMetadata = documentMetadataRepo.save(documentMetadata);
        List<Document> parsedDocs = null;
        int chunksCreated = 0;

        try {
            // parse the file
            parsedDocs = parserService.parse(file);

            // ingest service
            chunksCreated = ingestionService.ingest(documentMetadata, parsedDocs);
        } catch (DocumentProcessingException e) {
            log.info("Document metadata deleting due to fail processing");
            documentMetadataRepo.delete(documentMetadata);
            throw e;
        }

        // documentMetadata.setTotalChunks(chunksCreated);
        // save the document metadata

        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFilename())
                .fileSize(documentMetadata.getFileSize())
                .chunksCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("Document successfully processed and indexed.")
                .build();

    }

    public List<DocumentResponseDto> uploadMultipleDocuments(List<MultipartFile> files) {

        List<DocumentResponseDto> responseDtos = new ArrayList<>();

        for (MultipartFile file : files) {
            DocumentResponseDto result = this.uploadAndProcess(file);
            responseDtos.add(result);
        }

        return responseDtos;

    }

    public List<DocumentMetadataDto> getAllDocuments() {

        List<DocumentMetadata> allDocuments = documentMetadataRepo.findAllByOrderByCreatedAtDesc();
        return allDocuments.stream()
                .map(documentMetadata -> modelMapper.map(documentMetadata, DocumentMetadataDto.class))
                .toList();

    }

    public DocumentMetadataDto getDocumentById(UUID id) {
        DocumentMetadata documentMetadata = documentMetadataRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));
        return modelMapper.map(documentMetadata, DocumentMetadataDto.class);

    }

    public List<DocumentChunkDto> getDocumentChunks(UUID id) {
        documentMetadataRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));

        String sql = "SELECT id, content, metadata FROM vector_store WHERE metadata->>'documentId' = ? ORDER BY CAST(COALESCE(metadata->>'chunkIndex', '0') AS INTEGER) ASC";
        try {
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                String chunkId = rs.getString("id");
                String content = rs.getString("content");
                String metaStr = rs.getString("metadata");
                java.util.Map<String, Object> metaMap = new java.util.HashMap<>();
                Integer chunkIndex = null;
                Integer pageNumber = null;
                if (metaStr != null && !metaStr.isBlank()) {
                    try {
                        metaMap = objectMapper.readValue(metaStr, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                        if (metaMap.get("chunkIndex") instanceof Number n) {
                            chunkIndex = n.intValue();
                        }
                        if (metaMap.get("pageNumber") instanceof Number n) {
                            pageNumber = n.intValue();
                        } else if (metaMap.get("page_number") instanceof Number n) {
                            pageNumber = n.intValue();
                        }
                    } catch (Exception e) {
                        log.debug("Could not parse metadata JSON: {}", e.getMessage());
                    }
                }
                return DocumentChunkDto.builder()
                        .id(chunkId)
                        .documentId(id)
                        .chunkIndex(chunkIndex != null ? chunkIndex : rowNum)
                        .pageNumber(pageNumber)
                        .snippet(content)
                        .metadata(metaMap)
                        .build();
            }, id.toString());
        } catch (Exception e) {
            log.error("Failed to query chunks from vector_store for document {}: {}", id, e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    @Transactional
    public void deleteDocument(UUID id) {
        DocumentMetadata documentMetadata = documentMetadataRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));

        documentMetadataRepo.delete(documentMetadata);
        // delete the vector entries
        try {
            String deleteVectorsSql = "DELETE FROM vector_store WHERE metadata->>'documentId' = ?";
            int deletedCount = jdbcTemplate.update(deleteVectorsSql, id.toString());
            log.info("Deleted {} vector chunks for document id {} ", deletedCount, id);

        } catch (Exception e) {
            log.warn("cloud not delete vectors from vector store directly: {}", e.getMessage());
        }

    }
}