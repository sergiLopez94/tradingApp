package com.example.tradingapp.controller;

import com.example.tradingapp.data.ClientRepository;
import com.example.tradingapp.data.TransactionRepository;
import com.example.tradingapp.model.Client;
import com.example.tradingapp.model.Transaction;
import com.example.tradingapp.service.FileProcessingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for TradingController
 * REQ-010: Test REST API connection between frontend and backend
 * REQ-011: Test all API methods (get transactions, upload file)
 * REQ-014: Test database persistence of transactions
 * REQ-008: Test file transfer from frontend to backend
 * 
 * These tests verify:
 * - API endpoint functionality
 * - Database integration with JPA
 * - End-to-end file processing workflow
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TradingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Clean database before each test
        transactionRepository.deleteAll();
        clientRepository.deleteAll();
    }

    /**
     * REQ-011: Test GET /api/transactions/{clientId}
     * REQ-014: Verify data retrieval from PostgreSQL/H2 database
     */
    @Test
    void testGetTransactions_Success() throws Exception {
        // Arrange - Insert test data into database
        String clientId = "TEST001";
        
        Client client = new Client();
        client.setId(clientId);
        client.setName("Test Client");
        client.setEmail("test@example.com");
        client.setBirthDate("1990-01-01");
        client.setDepot(clientId);
        clientRepository.save(client);

        Transaction t1 = new Transaction();
        t1.setClientId(clientId);
        t1.setTransactionId("TX001");
        t1.setDate("2024-01-15");
        t1.setAsset("Apple Inc.");
        t1.setIsin("US0378331005");
        t1.setTicker("AAPL");
        t1.setAssetType("Aktie");
        t1.setQuantity(10.0);
        t1.setUnitPrice(150.0);
        t1.setTotalValue(1500.0);
        transactionRepository.save(t1);

        Transaction t2 = new Transaction();
        t2.setClientId(clientId);
        t2.setTransactionId("TX002");
        t2.setDate("2024-01-16");
        t2.setAsset("Microsoft Corp.");
        t2.setIsin("US5949181045");
        t2.setTicker("MSFT");
        t2.setAssetType("Aktie");
        t2.setQuantity(5.0);
        t2.setUnitPrice(300.0);
        t2.setTotalValue(1500.0);
        transactionRepository.save(t2);

        // Act & Assert - REQ-010: Test HTTP REST API call
        mockMvc.perform(get("/api/transactions/{clientId}", clientId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].clientId", is(clientId)))
                .andExpect(jsonPath("$[0].asset", is("Apple Inc.")))
                .andExpect(jsonPath("$[0].ticker", is("AAPL")))
                .andExpect(jsonPath("$[0].quantity", is(10.0)))
                .andExpect(jsonPath("$[1].asset", is("Microsoft Corp.")))
                .andExpect(jsonPath("$[1].ticker", is("MSFT")));
    }

    /**
     * REQ-011: Test GET /api/transactions/{clientId} with non-existent client
     */
    @Test
    void testGetTransactions_EmptyList() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/transactions/{clientId}", "NONEXISTENT"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    /**
     * REQ-008: Test POST /api/upload - File transfer from frontend to backend
     * REQ-011: Test file upload API method
     * REQ-014: Verify automatic database persistence after file processing
     */
    @Test
    void testUploadFile_Success() throws Exception {
        // Arrange - Create a markdown file with transaction data
        String fileContent = """
            **Depot:** UPLOAD001
            **Datum:** 2024-01-20
            
            | STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
            |-----------------|------------|------|--------|-----|------|-----------|
            | 15.00 | Tesla Inc. | US88160R1014 | TSLA | Aktie | 250.00 | 3750.00 |
            | 20.00 | Amazon.com Inc. | US0231351067 | AMZN | Aktie | 150.00 | 3000.00 |
            """;

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "portfolio.md",
            "text/markdown",
            fileContent.getBytes()
        );

        // Act - REQ-008: Upload file via REST API
        mockMvc.perform(multipart("/api/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.depot", is("UPLOAD001")))
                .andExpect(jsonPath("$.message", containsString("successfully")));

        // Assert - REQ-014: Verify data was persisted to database
        List<Transaction> transactions = transactionRepository.findByClientId("UPLOAD001");
        assertEquals(2, transactions.size());
        
        Transaction t1 = transactions.stream()
                .filter(t -> "TSLA".equals(t.getTicker()))
                .findFirst()
                .orElseThrow();
        assertEquals("Tesla Inc.", t1.getAsset());
        assertEquals(15.0, t1.getQuantity(), 0.01);
        assertEquals(250.0, t1.getUnitPrice(), 0.01);
        
        // Verify client was also created
        Client client = clientRepository.findById("UPLOAD001").orElseThrow();
        assertEquals("UPLOAD001", client.getDepot());
    }

    /**
     * REQ-008: Test file upload with invalid format
     */
    @Test
    void testUploadFile_InvalidFormat() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "invalid.txt",
            "text/plain",
            "This is not a valid portfolio format".getBytes()
        );

        // Act & Assert - Should still succeed but create default client
        mockMvc.perform(multipart("/api/upload").file(file))
                .andExpect(status().isOk());
    }

    /**
     * REQ-010: Test GET /api/client/{clientId} endpoint
     * REQ-014: Verify client data retrieval from database
     */
    @Test
    void testGetClient_Success() throws Exception {
        // Arrange
        String clientId = "CLIENT001";
        Client client = new Client();
        client.setId(clientId);
        client.setName("John Doe");
        client.setEmail("john.doe@example.com");
        client.setBirthDate("1985-05-15");
        client.setDepot(clientId);
        clientRepository.save(client);

        // Act & Assert
        mockMvc.perform(get("/api/client/{clientId}", clientId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(clientId)))
                .andExpect(jsonPath("$.name", is("John Doe")))
                .andExpect(jsonPath("$.email", is("john.doe@example.com")))
                .andExpect(jsonPath("$.birthDate", is("1985-05-15")))
                .andExpect(jsonPath("$.depot", is(clientId)));
    }

    /**
     * REQ-010: Test GET /api/client/{clientId} with non-existent client
     */
    @Test
    void testGetClient_NotFound() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/client/{clientId}", "NONEXISTENT"))
                .andExpect(status().isNotFound());
    }

    /**
     * REQ-014: Test complete workflow - Upload file and retrieve transactions
     * Integration test covering frontend → backend → database → frontend flow
     */
    @Test
    void testCompleteWorkflow_UploadAndRetrieve() throws Exception {
        // Step 1: Upload file (REQ-008)
        String fileContent = """
            **Depot:** WORKFLOW001
            **Datum:** 2024-01-25
            
            | STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
            |-----------------|------------|------|--------|-----|------|-----------|
            | 50.00 | Netflix Inc. | US64110L1061 | NFLX | Aktie | 400.00 | 20000.00 |
            """;

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "workflow.md",
            "text/markdown",
            fileContent.getBytes()
        );

        mockMvc.perform(multipart("/api/upload").file(file))
                .andExpect(status().isOk());

        // Step 2: Retrieve transactions (REQ-011, REQ-014)
        mockMvc.perform(get("/api/transactions/{clientId}", "WORKFLOW001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].asset", is("Netflix Inc.")))
                .andExpect(jsonPath("$[0].ticker", is("NFLX")))
                .andExpect(jsonPath("$[0].quantity", is(50.0)))
                .andExpect(jsonPath("$[0].totalValue", is(20000.0)));

        // Step 3: Retrieve client info
        mockMvc.perform(get("/api/client/{clientId}", "WORKFLOW001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.depot", is("WORKFLOW001")));
    }

    /**
     * REQ-014: Test data persistence across multiple uploads for same client
     */
    @Test
    void testMultipleUploads_SameClient() throws Exception {
        // First upload
        String fileContent1 = """
            **Depot:** MULTI001
            **Datum:** 2024-01-01
            
            | STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
            |-----------------|------------|------|--------|-----|------|-----------|
            | 10.00 | Stock A | US1111111111 | STKA | Aktie | 100.00 | 1000.00 |
            """;

        MockMultipartFile file1 = new MockMultipartFile(
            "file",
            "upload1.md",
            "text/markdown",
            fileContent1.getBytes()
        );

        mockMvc.perform(multipart("/api/upload").file(file1))
                .andExpect(status().isOk());

        // Second upload - should replace previous transactions
        String fileContent2 = """
            **Depot:** MULTI001
            **Datum:** 2024-01-02
            
            | STK. / Nominale | Wertpapier | ISIN | Symbol | Art | Kurs | Wert (EUR) |
            |-----------------|------------|------|--------|-----|------|-----------|
            | 20.00 | Stock B | US2222222222 | STKB | Aktie | 200.00 | 4000.00 |
            | 30.00 | Stock C | US3333333333 | STKC | Aktie | 300.00 | 9000.00 |
            """;

        MockMultipartFile file2 = new MockMultipartFile(
            "file",
            "upload2.md",
            "text/markdown",
            fileContent2.getBytes()
        );

        mockMvc.perform(multipart("/api/upload").file(file2))
                .andExpect(status().isOk());

        // Verify only the latest transactions exist
        List<Transaction> transactions = transactionRepository.findByClientId("MULTI001");
        assertEquals(2, transactions.size());
        assertTrue(transactions.stream().anyMatch(t -> "STKB".equals(t.getTicker())));
        assertTrue(transactions.stream().anyMatch(t -> "STKC".equals(t.getTicker())));
        assertFalse(transactions.stream().anyMatch(t -> "STKA".equals(t.getTicker())));
    }

    /**
     * REQ-010: Test CORS and content type handling
     */
    @Test
    void testApiEndpoints_CorsAndContentType() throws Exception {
        // Arrange
        String clientId = "CORS001";
        Client client = new Client();
        client.setId(clientId);
        client.setDepot(clientId);
        clientRepository.save(client);

        // Act & Assert - Verify JSON response
        mockMvc.perform(get("/api/client/{clientId}", clientId)
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(header().exists("Access-Control-Allow-Origin"));
    }
}
