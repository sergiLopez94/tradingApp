package com.example.tradingapp.controller;

import com.example.tradingapp.data.TransactionRepository;
import com.example.tradingapp.data.ClientRepository;
import com.example.tradingapp.model.Transaction;
import com.example.tradingapp.model.Client;
import com.example.tradingapp.service.FileProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") // For frontend
public class TradingController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private FileProcessingService fileProcessingService;

    @GetMapping("/transactions/{clientId}")
    public List<Transaction> getTransactions(@PathVariable String clientId) {
        return transactionRepository.findByClientId(clientId);
    }

    @PostMapping("/upload")
    public ResponseEntity<java.util.Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String depot = fileProcessingService.processFile(file);
            java.util.Map<String, String> response = new java.util.HashMap<>();
            response.put("depot", depot);
            response.put("message", "File processed successfully for depot: " + depot);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            java.util.Map<String, String> error = new java.util.HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/client/{id}")
    public ResponseEntity<Client> getClient(@PathVariable String id) {
        return clientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}