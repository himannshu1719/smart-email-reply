package com.email.assistant.controller;

import com.email.assistant.entity.EmailRequest;
import com.email.assistant.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/email")
public class EmailController
{
    @Autowired
    private EmailService emailService;
    @PostMapping("/generate")
    public ResponseEntity<String> generateEmail(@RequestBody EmailRequest emailRequest)
    {
        String response =emailService.generateEmailReply(emailRequest);
        return ResponseEntity.ok(response);
    }

}
