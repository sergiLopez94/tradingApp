package com.example.tradingapp.service;

import com.example.tradingapp.data.ClientRepository;
import com.example.tradingapp.data.TransactionRepository;
import com.example.tradingapp.model.Client;
import com.example.tradingapp.model.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FileProcessingService
 * Tests requirements: REQ-007 (file upload), REQ-013 (data processing)
 */
@ExtendWith(MockitoExtension.class)
public class FileProcessingServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private FileProcessingService fileProcessingService;

    private Random random;

    @BeforeEach
    void setUp() {
        random = new Random();
    }

    /**
     * Helper: Generate random depot ID
     */
    private String generateRandomDepot() {
        return "DEPOT" + (1000 + random.nextInt(9000));
    }

    /**
     * Helper: Generate random date in dd.MM.yyyy format
     */
    private String generateRandomDate() {
        LocalDate date = LocalDate.now().minusDays(random.nextInt(365));
        return date.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
    }

    /**
     * Helper: Generate random quantity between 1 and 1000
     */
    private double generateRandomQuantity() {
        return 1 + random.nextInt(1000);
    }

    /**
     * Helper: Generate random price between 10.00 and 500.00
     */
    private double generateRandomPrice() {
        return 10 + (random.nextDouble() * 490);
    }

    /**
     * REQ-007: Test processing markdown file with valid table format
     * REQ-013: Tests file parsing with randomized quantities and prices
     */
    @Test
    void testProcessMarkdownFile_ValidTableFormat() throws IOException {
        // Arrange: Generate random test data
        String depot = generateRandomDepot();
        String date = generateRandomDate();
        double quantity1 = generateRandomQuantity();
        double price1 = generateRandomPrice();
        double total1 = quantity1 * price1;

        String markdownContent = String.format("""
            **Depot:** %s
            **Datum:** %s
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | %s | Apple Inc.<br>ISIN: US0378331005 | AAPL | %s | %s | %s |
            """, depot, date, 
            String.format("%.2f", quantity1).replace('.', ','),
            String.format("%.2f", price1).replace('.', ','),
            date,
            String.format("%.2f", total1).replace('.', ','));

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "portfolio.md",
            "text/markdown",
            markdownContent.getBytes()
        );

        when(clientRepository.findById(depot)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(depot)).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals(depot, resultDepot);
        
        // Verify client was created
        ArgumentCaptor<Client> clientCaptor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository, atLeastOnce()).save(clientCaptor.capture());
        Client savedClient = clientCaptor.getValue();
        assertEquals(depot, savedClient.getId());
        assertEquals(depot, savedClient.getDepot());
        
        // Verify transaction was saved
        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, atLeastOnce()).save(transactionCaptor.capture());
        Transaction savedTransaction = transactionCaptor.getValue();
        assertEquals(depot, savedTransaction.getClientId());
        assertEquals("Apple Inc.", savedTransaction.getAsset());
        assertEquals("US0378331005", savedTransaction.getIsin());
        assertEquals("AAPL", savedTransaction.getTicker());
        assertEquals(quantity1, savedTransaction.getQuantity(), 0.01);
        assertEquals(price1, savedTransaction.getUnitPrice(), 0.01);
        assertEquals(total1, savedTransaction.getTotalValue(), 0.01);
    }

    /**
     * REQ-013: Test processing multiple transactions with random data
     */
    @Test
    void testProcessMarkdownFile_MultipleTransactions() throws IOException {
        // Arrange: Create 3-7 random transactions
        String depot = generateRandomDepot();
        String date = generateRandomDate();
        int numTransactions = 3 + random.nextInt(5);
        
        StringBuilder content = new StringBuilder();
        content.append(String.format("**Depot:** %s\n", depot));
        content.append(String.format("**Datum:** %s\n\n", date));
        content.append("| STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |\n");
        content.append("|-----------------|-----------------------|--------|----------------------|-----------|----------------|\n");
        
        for (int i = 0; i < numTransactions; i++) {
            double qty = generateRandomQuantity();
            double price = generateRandomPrice();
            double total = qty * price;
            String qtyStr = String.format("%.2f", qty).replace('.', ',');
            String priceStr = String.format("%.2f", price).replace('.', ',');
            String totalStr = String.format("%.2f", total).replace('.', ',');
            content.append(String.format("| %s | Asset%d<br>ISIN: ISIN%d | TICK%d | %s | %s | %s |\n",
                qtyStr, i, i, i, priceStr, date, totalStr));
        }

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "portfolio.md",
            "text/markdown",
            content.toString().getBytes()
        );

        when(clientRepository.findById(depot)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(depot)).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals(depot, resultDepot);
        verify(clientRepository).save(any(Client.class));
        verify(transactionRepository, times(numTransactions)).save(any(Transaction.class));
    }

    /**
     * REQ-013: Test plain text file processing with table format
     */
    @Test
    void testProcessTextFile() throws IOException {
        // Arrange
        String depot = "TEST123";
        String content = """
            **Depot:** TEST123
            **Datum:** 01.12.2024
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | 10,00 | Tesla Inc.<br>ISIN: US88160R1014 | TSLA | 250,50 | 01.12.2024 | 2.505,00 |
            """;

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "portfolio.txt",
            "text/plain",
            content.getBytes()
        );

        when(clientRepository.findById("TEST123")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId("TEST123")).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals("TEST123", resultDepot);
        verify(clientRepository).save(any(Client.class));
        verify(transactionRepository).findByClientId("TEST123");
        verify(transactionRepository, atLeastOnce()).save(any(Transaction.class));
    }

    /**
     * REQ-013: Test edge case - empty file
     */
    @Test
    void testProcessEmptyFile() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "empty.txt",
            "text/plain",
            "".getBytes()
        );

        when(clientRepository.findById(anyString())).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(anyString())).thenReturn(new ArrayList<>());

        // Act
        String depot = fileProcessingService.processFile(file);

        // Assert: Should save a client with empty depot ID
        assertNotNull(depot);
        verify(clientRepository).save(any(Client.class));
    }

    /**
     * REQ-013: Test malformed table row (insufficient columns)
     */
    @Test
    void testProcessMalformedTableRow() throws IOException {
        // Arrange: Table row with missing columns
        String depot = "DEPOT999";
        String content = """
            **Depot:** DEPOT999
            **Datum:** 15.11.2024
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | 5,00 | Incomplete Row |
            """;

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "malformed.md",
            "text/markdown",
            content.getBytes()
        );

        when(clientRepository.findById("DEPOT999")).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId("DEPOT999")).thenReturn(new ArrayList<>());

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert: Should process without throwing exception, but skip malformed row
        assertEquals("DEPOT999", resultDepot);
        verify(clientRepository).save(any(Client.class));
        // No transaction should be saved for malformed row
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    /**
     * REQ-013: Test updating existing client
     */
    @Test
    void testProcessFile_UpdateExistingClient() throws IOException {
        // Arrange
        String depot = "DEPOT123";
        String date = "10.10.2024";
        Client existingClient = new Client();
        existingClient.setId(depot);
        existingClient.setName("Existing Client");
        existingClient.setDepot(depot);

        String content = String.format("""
            **Depot:** %s
            **Datum:** %s
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | 25,00 | Microsoft Corp.<br>ISIN: US5949181045 | MSFT | 350,00 | %s | 8.750,00 |
            """, depot, date, date);

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "update.md",
            "text/markdown",
            content.getBytes()
        );

        when(clientRepository.findById(depot)).thenReturn(Optional.of(existingClient));
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(depot)).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals(depot, resultDepot);
        verify(clientRepository).findById(depot);
        verify(clientRepository).save(any(Client.class));
        verify(transactionRepository).save(any(Transaction.class));
    }

    /**
     * REQ-013: Test handling special characters in asset names
     */
    @Test
    void testProcessFile_SpecialCharactersInAssetName() throws IOException {
        // Arrange
        String depot = "DEPOT777";
        String date = "05.09.2024";
        String content = String.format("""
            **Depot:** %s
            **Datum:** %s
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | 15,00 | McDonald's Corp. & Co.<br>ISIN: US5801351017 | MCD | 280,50 | %s | 4.207,50 |
            """, depot, date, date);

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "special.md",
            "text/markdown",
            content.getBytes()
        );

        when(clientRepository.findById(depot)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(depot)).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals(depot, resultDepot);
        
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction savedTransaction = captor.getValue();
        assertEquals("McDonald's Corp. & Co.", savedTransaction.getAsset());
    }

    /**
     * REQ-013: Test handling large numbers
     */
    @Test
    void testProcessFile_LargeNumbers() throws IOException {
        // Arrange
        String depot = "DEPOT888";
        String date = "20.08.2024";
        double largeQty = 999999;
        double largePrice = 999.99;
        double largeTotal = largeQty * largePrice;

        String largeQtyStr = String.format("%.2f", largeQty).replace('.', ',');
        String largePriceStr = String.format("%.2f", largePrice).replace('.', ',');
        String largeTotalStr = String.format("%.2f", largeTotal).replace('.', ',');
        
        String content = String.format("""
            **Depot:** %s
            **Datum:** %s
            
            | STK. / Nominale | Wertpapierbezeichnung | Ticker | Kurs pro Stück (EUR) | Kursdatum | Kurswert (EUR) |
            |-----------------|-----------------------|--------|----------------------|-----------|----------------|
            | %s | BIG Holdings<br>ISIN: BIG123456789 | BIG | %s | %s | %s |
            """, depot, date, largeQtyStr, largePriceStr, date, largeTotalStr);

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "large.md",
            "text/markdown",
            content.getBytes()
        );

        when(clientRepository.findById(depot)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.findByClientId(depot)).thenReturn(new ArrayList<>());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        String resultDepot = fileProcessingService.processFile(file);

        // Assert
        assertEquals(depot, resultDepot);
        
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        Transaction savedTransaction = captor.getValue();
        assertEquals(largeQty, savedTransaction.getQuantity(), 0.01);
        assertEquals(largePrice, savedTransaction.getUnitPrice(), 0.01);
        assertEquals(largeTotal, savedTransaction.getTotalValue(), 0.01);
    }
}
