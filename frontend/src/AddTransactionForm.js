import React, { useState } from 'react';
import { addTransaction } from './api';

const AddTransactionForm = ({ onTransactionAdded }) => {
  const [transactionType, setTransactionType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [platform, setPlatform] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const transaction = {
      transaction_type: transactionType,
      amount,
      date,
      platform
    };
    const response = await addTransaction(transaction);
    if (response) {
      alert("Transaction added successfully!");
      if (onTransactionAdded) {
        onTransactionAdded(); // Call to refresh transactions
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Transaction Type:
        <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </label>
      <label>
        Amount:
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label>
        Date:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label>
        Platform:
        <input
          type="text"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />
      </label>
      <button type="submit">Add Transaction</button>
    </form>
  );
};

export default AddTransactionForm;
