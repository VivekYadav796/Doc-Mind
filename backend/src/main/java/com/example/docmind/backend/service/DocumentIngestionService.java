package com.example.docmind.backend.service;

import com.example.docmind.backend.config.AppProperties;
import com.example.docmind.backend.entity.DocumentMetadata;
import com.example.docmind.backend.entity.DocumentStatus;
import com.example.docmind.backend.exception.DocumentProcessingException;
import com.example.docmind.backend.repository.*;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);

    private final VectorStore vectorStore;
    private final DocumentMetadataRepo documentMetadataRepo;
    private final AppProperties appProperties;

    public int ingest(DocumentMetadata metadata, List<Document> parsedDocs) {
        log.info("Ingesting document [id={}, name={}, pages={}]", metadata.getId(), metadata.getFilename(),
                metadata.getFileSize());

        // Keep track of generated IDs for explicit rollback/cleanup if writing fails
        List<String> generatedChunkIds = new ArrayList<>();

        try {
            metadata.setStatus(DocumentStatus.PROCESSING);
            metadata.setTotalPages(parsedDocs.size());

            // 1. Text chunking using TokenTextSplitter
            TokenTextSplitter tokenTextSplitter = TokenTextSplitter.builder()
                    .withChunkSize(appProperties.getRag().getChunkSize())
                    .withMinChunkSizeChars(appProperties.getRag().getMinChunkSizeChars())
                    .withMinChunkLengthToEmbed(appProperties.getRag().getMinChunkLengthToEmbed())
                    .withMaxNumChunks(appProperties.getRag().getMaxNumChunks())
                    .withKeepSeparator(true)
                    .build();

            List<Document> chunks = tokenTextSplitter.apply(parsedDocs);
            if (chunks.isEmpty()) {
                metadata.setStatus(DocumentStatus.FAILED);
                metadata.setErrorMessage("Document appears to be empty or unscannable");
                documentMetadataRepo.save(metadata);
                return 0;
            }

            // 2. Metadata enrichment on each chunk
            List<Document> enrichedChunks = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                Document chunk = chunks.get(i);
                Map<String, Object> enrichedMetadata = new HashMap<>(chunk.getMetadata());
                enrichedMetadata.put("documentId", metadata.getId().toString());
                enrichedMetadata.put("fileName", metadata.getFilename());
                enrichedMetadata.put("contentType", metadata.getContentType());
                enrichedMetadata.put("chunkIndex", i);

                Object pageNumber = chunk.getMetadata().get("page_number");
                if (pageNumber == null) {
                    pageNumber = chunk.getMetadata().get("pageNumber");
                }
                if (pageNumber != null) {
                    enrichedMetadata.put("pageNumber", pageNumber);
                }

                // FIX: Generate a deterministic or tracked ID so we can delete them if the
                // batch fails
                String readableChunkRef = metadata.getId().toString() + "-chunk-" + i;
                UUID chunkUuid = UUID.nameUUIDFromBytes(readableChunkRef.getBytes(StandardCharsets.UTF_8));
                String uniqueChunkId = chunkUuid.toString();
                generatedChunkIds.add(uniqueChunkId);

                enrichedMetadata.put("chunkRef", readableChunkRef);

                Document enrichedDoc = new Document(uniqueChunkId, chunk.getText(), enrichedMetadata);
                enrichedChunks.add(enrichedDoc);
            }

            // 3. Write chunks and embedding to pg vector
            log.info("Writing {} vector chunks to PgVectorStore for document: {}", enrichedChunks.size(),
                    metadata.getFilename());
            vectorStore.add(enrichedChunks);

            // 4. Update document status to index
            metadata.setStatus(DocumentStatus.INDEXED);
            metadata.setTotalChunks(enrichedChunks.size());
            metadata.setErrorMessage(null);
            documentMetadataRepo.save(metadata);
            log.info("Successfully indexed document [id={}, name={}, chunks={}]", metadata.getId(),
                    metadata.getFilename(), enrichedChunks.size());

            return enrichedChunks.size();
        } catch (Exception ex) {
            log.error("Failed to ingest document into vector store: {}. Triggering cleanup.", metadata.getFilename(),
                    ex);

            // FIX: Rollback/Cleanup vectors from PGVector if any chunks were generated
            if (!generatedChunkIds.isEmpty()) {
                try {
                    log.info("Removing partial vectors for document ID: {}", metadata.getId());
                    vectorStore.delete(generatedChunkIds);
                } catch (Exception deleteEx) {
                    log.error("Critical: Failed to clean up orphaned vectors for document: {}", metadata.getId(),
                            deleteEx);
                }
            }

            metadata.setStatus(DocumentStatus.FAILED);
            metadata.setErrorMessage(ex.getMessage());
            documentMetadataRepo.save(metadata);
            throw new DocumentProcessingException("Failed to index document: " + ex.getMessage(), ex);
        }
    }
}
