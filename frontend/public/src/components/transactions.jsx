import React, { useEffect, useState } from "react";
import axios from "axios";

const TransactionsTable = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get("http://localhost:8000/transactions");
                setTransactions(res.data);
            } catch (err) {
                console.error("Error fetching transactions:", err);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2>M-Pesa Transactions</h2>
            <table border="1" cellPadding="10" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Amount</th>
                        <th>Phone Number</th>
                        <th>Transaction ID</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length > 0 ? (
                        transactions.map((tx, idx) => (
                            <tr key={idx}>
                                <td>{tx.amount}</td>
                                <td>{tx.number}</td>
                                <td>{tx.trnx_id}</td>
                                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No transactions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionsTable;