package com.example.docmind.backend.respository;


import com.example.docmind.backend.entity.DocumentMetadata;
import com.example.docmind.backend.entity.DocumentStatus;
//import com.example.docmind.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
//import java.util.Optional;
import java.util.UUID;

public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {

    List<DocumentMetadata> findByStatus(DocumentStatus status);

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();


    //List<DocumentMetadata> findByUserOrderByCreatedAtDesc(User user);

    //Optional<DocumentMetadata> findByIdAndUser(UUID id, User user);

}
