package com.example.tradingapp.service;

import com.example.tradingapp.data.ClientRepository;
import com.example.tradingapp.data.TransactionRepository;
import com.example.tradingapp.model.Client;
import com.example.tradingapp.model.Transaction;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class FileProcessingService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private String lastProcessedDepot = "1"; // Default

    public String processFile(MultipartFile file) throws IOException {
        String content = extractContent(file);
        parseAndSave(content);
        return lastProcessedDepot;
    }

    private String extractContent(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            RandomAccessReadBuffer buffer = new RandomAccessReadBuffer(file.getInputStream());
            PDDocument document = Loader.loadPDF(buffer);
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            document.close();
            return text;
        } else if (filename != null && filename.toLowerCase().endsWith(".docx")) {
            // Assume Word document
            XWPFDocument document = new XWPFDocument(file.getInputStream());
            XWPFWordExtractor extractor = new XWPFWordExtractor(document);
            String text = extractor.getText();
            document.close();
            return text;
        } else if (filename != null && filename.toLowerCase().endsWith(".html")) {
            // Assume HTML file
            String html = new String(file.getInputStream().readAllBytes());
            return Jsoup.parse(html).text();
        } else if (filename != null && filename.toLowerCase().endsWith(".md")) {
            // Assume Markdown file
            BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            return content.toString();
        } else {
            // Assume text file
            BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
            return content.toString();
        }
    }

    private void parseAndSave(String content) {
        System.out.println("Extracted content: " + content);
        String[] lines = content.split("\n");
        
        // Extract depot and date
        String depot = "";
        String statementDate = "";
        for (String line : lines) {
            line = line.trim();
            if (line.contains("**Depot:**")) {
                depot = line.replace("**Depot:**", "").trim();
            } else if (line.contains("**Datum:**")) {
                statementDate = line.replace("**Datum:**", "").trim();
            }
        }
        
        System.out.println("Parsed depot: " + depot + ", date: " + statementDate);
        
        // Update or create client
        Client client = clientRepository.findById(depot).orElse(new Client());
        client.setId(depot);
        client.setName("Client " + depot);
        client.setEmail("client" + depot + "@example.com");
        client.setBirthDate("2000-01-01");
        client.setDepot(depot);
        clientRepository.save(client);
        lastProcessedDepot = depot;
        System.out.println("Saved/Updated client: " + depot);
        
        // Detect format and parse accordingly
        boolean isTableFormat = false;
        for (String line : lines) {
            if (line.contains("| STK. / Nominale |")) {
                isTableFormat = true;
                break;
            }
        }
        
        System.out.println("Detected table format: " + isTableFormat);
        
        if (isTableFormat) {
            parseTableFormat(lines, depot, statementDate);
        } else {
            parseLineFormat(lines, depot, statementDate);
        }
    }    private void parseTableFormat(String[] lines, String depot, String statementDate) {
        // Clear old transactions
        List<Transaction> oldTransactions = transactionRepository.findByClientId(depot);
        for (Transaction t : oldTransactions) {
            transactionRepository.delete(t);
        }
        
        // Process the lines - handle concatenated rows with "||"
        boolean inTable = false;
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("| STK. / Nominale |")) {
                inTable = true;
                continue;
            }
            if (inTable && line.startsWith("|") && !line.startsWith("|---") && !line.contains("STK. / Nominale")) {
                // If the line contains "||", split into separate rows
                if (line.contains("||")) {
                    String[] subRows = line.split("\\|\\|");
                    for (String subRow : subRows) {
                        String trimmed = subRow.trim();
                        if (!trimmed.isEmpty()) {
                            if (!trimmed.startsWith("|")) {
                                trimmed = "|" + trimmed;
                            }
                            processTableRow(trimmed, depot, statementDate);
                        }
                    }
                } else {
                    processTableRow(line, depot, statementDate);
                }
            }
            if (line.isEmpty() && inTable) {
                inTable = false;
            }
        }
    }
    
    private void processTableRow(String rowLine, String depot, String statementDate) {
        System.out.println("Processing row: " + rowLine);
        String[] parts = rowLine.split("\\|");
        if (parts.length >= 6) {
            String quantityStr = parts[1].trim();
            String nameStr = parts[2].trim().replace("<br>", " ").replace("\n", " ");
            String priceStr = parts[3].trim();
            String dateStr = parts[4].trim();
            String valueStr = parts[5].trim();
            
            // Extract ISIN from name
            String isin = "";
            String[] nameParts = nameStr.split("ISIN: ");
            String asset = nameParts[0].trim();
            if (nameParts.length > 1) {
                isin = nameParts[1].split(" ")[0];
            }
            
            System.out.println("Quantity: " + quantityStr + ", Asset: " + asset + ", ISIN: " + isin + ", Price: " + priceStr + ", Value: " + valueStr);
            
            try {
                double quantity = parseGermanNumber(quantityStr);
                double unitPrice = parseGermanNumber(priceStr);
                double totalValue = parseGermanNumber(valueStr);
                
                Transaction transaction = new Transaction();
                transaction.setId(depot + "-" + isin);
                transaction.setClientId(depot);
                transaction.setTransactionId(isin);
                transaction.setDate(statementDate);
                transaction.setAsset(asset);
                transaction.setQuantity(quantity);
                transaction.setUnitPrice(unitPrice);
                transaction.setTotalValue(totalValue);
                transactionRepository.save(transaction);
                System.out.println("Saved transaction: " + asset + " - " + quantity);
            } catch (NumberFormatException e) {
                System.err.println("Error parsing table row: " + rowLine + " - Error: " + e.getMessage());
            }
        } else {
            System.out.println("Skipping row with insufficient columns: " + rowLine + " (parts: " + parts.length + ")");
        }
    }
    
    private double parseGermanNumber(String numberStr) {
        // Handle German number format: remove dots (thousand separators) and replace comma with dot
        String cleaned = numberStr.replace(".", "").replace(",", ".");
        return Double.parseDouble(cleaned);
    }
    
    private void parseLineFormat(String[] lines, String depot, String statementDate) {
        // Clear old transactions for this client
        List<Transaction> oldTransactions = transactionRepository.findByClientId(depot);
        for (Transaction t : oldTransactions) {
            transactionRepository.delete(t);
        }
        
        // Parse positions
        int i = 0;
        while (i < lines.length) {
            String line = lines[i].trim();
            if (line.contains(" Stk. ")) {
                // Start of position
                String[] parts = line.split(" Stk. ");
                double quantity = Double.parseDouble(parts[0].trim().replace(",", "."));
                String asset = parts[1].trim();
                
                // Skip to ISIN
                i++;
                while (i < lines.length && !lines[i].trim().startsWith("ISIN:")) {
                    i++;
                }
                String isin = "";
                if (i < lines.length) {
                    isin = lines[i].trim().substring(6);
                    i++;
                }
                
                // Skip Lagerland and Wertpapierrechnung if present
                while (i < lines.length && (lines[i].trim().startsWith("Lagerland:") || lines[i].trim().contains("Wertpapierrechnung"))) {
                    i++;
                }
                
                // Price
                double unitPrice = Double.parseDouble(lines[i].trim().replace(",", "."));
                i++;
                
                // Date (should be statement date)
                i++;
                
                // Total value
                double totalValue = Double.parseDouble(lines[i].trim().replace(",", "."));
                i++;
                
                // Save transaction
                Transaction transaction = new Transaction();
                transaction.setId(depot + "-" + isin);
                transaction.setClientId(depot);
                transaction.setTransactionId(isin);
                transaction.setDate(statementDate);
                transaction.setAsset(asset);
                transaction.setQuantity((int) Math.round(quantity));
                transaction.setUnitPrice(unitPrice);
                transaction.setTotalValue(totalValue);
                transactionRepository.save(transaction);
                System.out.println("Saved transaction: " + asset + " - " + quantity);
            } else {
                i++;
            }
        }
    }
}