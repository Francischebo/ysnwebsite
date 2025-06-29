import React, { useState } from "react";
import axios from "axios";

const PaymentForm = () => {
    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await axios.post("http://localhost:5000/stk", {
                phone,
                amount,
            });

            console.log(response.data);
            setSuccess(true);
            setPhone("");
            setAmount("");
        } catch (err) {
            setError("Failed to initiate payment. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return <SuccessPage />;
    }

    return (
        <div style={{ maxWidth: "400px", margin: "auto", padding: "40px" }}>
            <h2>Make a Payment</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "15px" }}>
                    <label>
                        Phone Number (e.g., 712345678):
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </label>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>
                        Amount:
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="1"
                            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                        />
                    </label>
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Processing..." : "Pay Now"}
                </button>
            </form>
        </div>
    );
};

export default PaymentForm;