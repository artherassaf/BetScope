import React from 'react';

const TransactionList = ({ transactions }) => {
  return (
    <div>
      <h2>Transaction History</h2>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {transaction.transaction_type} of ${transaction.amount} on {transaction.date} via {transaction.platform}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
