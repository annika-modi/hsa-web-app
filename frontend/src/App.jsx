import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// The backend API is running on port 5000
const API_URL = 'http://127.0.0.1:5000/api';

// Main App component
function App() {
  // State for different views: 'create-account', 'dashboard', 'deposit', 'issue-card', 'transaction'
  const [currentView, setCurrentView] = useState('create-account');
  const [userName, setUserName] = useState('');
  const [account, setAccount] = useState(null);
  const [card, setCard] = useState(null);
  const [message, setMessage] = useState('');

  // Function to navigate between views
  const navigateTo = (view) => {
    setCurrentView(view);
    setMessage('');
  };

  // Reset all state and go back to the start
  const handleReset = () => {
    setUserName('');
    setAccount(null);
    setCard(null);
    setMessage('');
    setCurrentView('create-account');
  };

  const handleCreateAccount = async () => {
    if (!userName) {
      setMessage('Please enter your name to create an account.');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/create-account`, { name: userName });
      setAccount(response.data);
      setMessage(`Account created successfully!`);
      navigateTo('dashboard');
    } catch (error) {
      setMessage('Error creating account. Please try again.');
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(prompt("Enter amount to deposit:", "500"));
    if (isNaN(amount) || amount <= 0) {
      setMessage("Invalid amount.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/deposit`, { accountId: account.account_id, amount });
      setAccount(response.data);
      setMessage(`$${amount} deposited successfully. New balance: $${response.data.balance.toFixed(2)}`);
      navigateTo('dashboard');
    } catch (error) {
      setMessage("Error making deposit.");
    }
  };

  const handleIssueCard = async () => {
    try {
      const response = await axios.post(`${API_URL}/issue-card`, { accountId: account.account_id });
      setCard(response.data.card);
      setAccount(response.data.account);
      // Instead of navigating immediately, show a confirmation message.
      setMessage('Virtual card issued successfully!');
      
      // Wait for 2 seconds before showing the transaction button.
      setTimeout(() => {
        setMessage(''); // Clear the message after the delay
        navigateTo('dashboard');
      }, 2000);

    } catch (error) {
      setMessage('Error issuing card.');
    }
  };

  const handleValidateTransaction = async () => {
    const amount = parseFloat(prompt("Enter transaction amount:", "25"));
    const merchant = prompt("Enter merchant name (e.g., CVS Pharmacy, Doctor's Office):");

    if (isNaN(amount) || amount <= 0 || !merchant) {
      setMessage("Invalid transaction details.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/validate-transaction`, {
        accountId: account.account_id,
        amount,
        merchant
      });

      if (response.data.approved) {
        setAccount(prevAccount => ({ ...prevAccount, balance: response.data.new_balance }));
        setMessage(`Transaction approved! New balance: $${response.data.new_balance.toFixed(2)}`);
      } else {
        setMessage(`Transaction declined. Reason: ${response.data.reason}`);
      }
      navigateTo('dashboard');

    } catch (error) {
      setMessage("Error processing transaction.");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'create-account':
        return (
          <div className="card">
            <h2>Start Your Health Journey</h2>
            <p>Create a secure Health Savings Account to manage your medical expenses.</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <button onClick={handleCreateAccount} className="primary-btn">Create Account</button>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="card dashboard-card">
            <div className="welcome-header">
              <i className="fa-solid fa-house-medical-circle-user icon-lg"></i>
              <h2>Welcome, {account.owner_name}!</h2>
            </div>
            <div className="balance-info">
              <p className="label">Current Balance</p>
              <p className="balance-amount">${account.balance.toFixed(2)}</p>
            </div>
            <div className="button-grid">
              <button onClick={() => navigateTo('deposit')} className="secondary-btn">
                <i className="fa-solid fa-money-bill-transfer icon-sm"></i>
                Deposit Funds
              </button>
              {!account.card_issued && (
                <button onClick={handleIssueCard} className="secondary-btn">
                  <i className="fa-solid fa-credit-card icon-sm"></i>
                  Issue Virtual Card
                </button>
              )}
              {account.card_issued && (
                <button onClick={handleValidateTransaction} className="secondary-btn">
                  <i className="fa-solid fa-cart-shopping icon-sm"></i>
                  Make a Transaction
                </button>
              )}
            </div>
            <button onClick={handleReset} className="link-btn" style={{ marginTop: '2rem' }}>Reset App</button>
          </div>
        );
      
      case 'deposit':
        return (
          <div className="card">
            <h2>Deposit Funds</h2>
            <p>Add virtual funds to your HSA to use for future medical expenses.</p>
            <div className="input-group">
                <input
                    type="number"
                    placeholder="Enter amount"
                    min="0"
                    onChange={(e) => {
                        const amount = parseFloat(e.target.value);
                        if (!isNaN(amount) && amount > 0) {
                            // A simple way to handle input for the deposit function
                            // The actual deposit is handled by the handleDeposit function
                        }
                    }}
                />
              <button onClick={handleDeposit} className="primary-btn">Confirm Deposit</button>
            </div>
            <button onClick={() => navigateTo('dashboard')} className="link-btn">Back to Dashboard</button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>HSA Health App <i className="fa-solid fa-notes-medical"></i></h1>
        <div className="subtitle">
            Your flexible spending companion.
        </div>
      </div>
      <div className="main-content">
          {renderView()}
          {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;