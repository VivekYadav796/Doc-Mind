package com.example.docmind.backend.exception;

public class DocumentProcessingException extends RuntimeException{
    public DocumentProcessingException(String message){
        super(message);
    }

    public DocumentProcessingException(){
        super("Error in processing documents !!");
    }

    public  DocumentProcessingException(String message, Throwable ex){
        super(message,ex);
    }
}
// by extending RuntimeException we create our own exception as DocumentProcessingException

// Why specifically RuntimeException?
//Because RuntimeException is an unchecked exception.