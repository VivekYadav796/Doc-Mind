package com.example.docmind.backend.entity;

// status can only contain one of the values defined inside DocumentStatus
public enum DocumentStatus {
    UPLOADING,
    PROCESSING,
    INDEXED,
    FAILED
}

//  suppose we have an enum named Color inside a class and have values RED, BLUE etc
// Color c1 = Color.RED;   // c1 stores red (whats how we access)


// Enums can have constructors and methods, executed separately for each constant



//    public enum sss{
//     INDEXED("Document is ready"),
//     FAILED("Document processing failed");

//     private final String description;

//     DocumentStatus(String description) {
//         this.description = description;
//     }
// }
