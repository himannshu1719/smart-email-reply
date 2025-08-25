package com.email.assistant.service;

import com.email.assistant.entity.EmailRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class EmailService
{
    private final WebClient webClient;
    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String generateEmailReply(EmailRequest emailRequest)
    {
        // build the prompt

        String prompt= buildPrompt(emailRequest);
        //craft a request
        Map<String,Object>requestBody=Map.of(
                "contents", new Object[] {
                        Map.of("parts",new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );
        // do req and get respg
        String response = webClient.post()
                .uri(geminiApiUrl + "?key=" + geminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();




        // extract and return response

        return extractResponseContent(response);
    }

    private String extractResponseContent(String response)
    {
        try
        {
            ObjectMapper mapper= new ObjectMapper();
            JsonNode rootNode= mapper.readTree(response);

            return rootNode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String buildPrompt(EmailRequest emailRequest)
    {
        StringBuilder prompt = new StringBuilder();
        prompt.append(" Generate a professional email reply for the following email content and dont generate the subject line ");
        if(emailRequest.getTone()!=null && !emailRequest.getTone().isEmpty())
        {
            prompt.append("use a ").append(emailRequest.getTone()).append("tone");

        }
        prompt.append("\n Original email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }

}
