package com.example.docmind.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@Tag(
        name = "Documents",
        description = "APIs for uploading and managing documents"
)
public class DocumentController {

    @Operation(
            summary = "Upload a PDF document",
            description = """
                    Uploads a PDF document for processing.

                    The document will be:
                    1. Read by the PDF reader
                    2. Split into chunks
                    3. Converted into embeddings
                    4. Stored in PGVector
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Document uploaded successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file"
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Document processing failed"
            )
    })
    @PostMapping(
            value = "/upload",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<?> upload(      // method 1
            @Parameter(
                    description = "PDF file to upload",
                    required = true,
                    content = @Content(
                            mediaType = "application/pdf"
                    )
            )
            @RequestParam("file") MultipartFile file
    ) {

        // Your existing PDF processing code

        return ResponseEntity.ok("PDF uploaded successfully");
    }


    // All above @PostMApping, @Operation, @ApiResponses for Method 1
}

