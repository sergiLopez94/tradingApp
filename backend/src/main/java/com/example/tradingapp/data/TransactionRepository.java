package com.example.tradingapp.data;

import com.example.tradingapp.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByClientId(String clientId);
}