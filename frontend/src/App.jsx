import React, { useState } from 'react';
import axios from 'axios';
import './App.css'
// The backend API is running on port 5000
const API_URL = 'http://127.0.0.1:5000/api';

// Main App component
function App() {
  // State for different views: 'landing-page', 'registration-step-1', 'registration-step-2', 'dashboard', 'deposit', 'make-transaction'
  const [currentView, setCurrentView] = useState('landing-page');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    ssn: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    citizenship: '',
    mobileNumber: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [account, setAccount] = useState(null);
  const [card, setCard] = useState(null);
  const [message, setMessage] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionExpense, setTransactionExpense] = useState(''); // Renamed state for clarity
  const [depositAmount, setDepositAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // New state for phone number


  // Function to handle form input changes for all fields except SSN
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // New function specifically for SSN formatting
  const handleSsnChange = (e) => {
    let value = e.target.value;
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Apply dashes
    if (value.length > 5) {
      value = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5, 9);
    } else if (value.length > 3) {
      value = value.substring(0, 3) + '-' + value.substring(3, 5);
    }
    
    // Limit to 11 characters (9 digits + 2 dashes)
    if (value.length > 11) {
      value = value.substring(0, 11);
    }

    setFormData(prevState => ({
      ...prevState,
      ssn: value
    }));
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const cleanedValue = value.replace(/\D/g, '');
    let formattedValue = '';
    
    // Apply dashes for phone number format (000-000-0000)
    if (cleanedValue.length > 0) {
      formattedValue += cleanedValue.substring(0, 3);
      if (cleanedValue.length > 3) {
        formattedValue += '-' + cleanedValue.substring(3, 6);
        if (cleanedValue.length > 6) {
          formattedValue += '-' + cleanedValue.substring(6, 10);
        }
      }
    }
    return formattedValue;
  };

  // Function to navigate between views
  const navigateTo = (view) => {
    setCurrentView(view);
    setMessage('');
  };

  // Reset all state and go back to the start
  const handleReset = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      ssn: '',
      dobMonth: '',
      dobDay: '',
      dobYear: '',
      citizenship: '',
      mobileNumber: '',
      email: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
    });
    setAccount(null);
    setCard(null);
    setMessage('');
    setCurrentView('landing-page');
  };

  const handleCreateAccount = async () => {
    // Construct the full name from form data
    const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
    
    if (!fullName) {
        setMessage('Please enter your name to create an account.');
        return;
    }

    try {
        // Send the full name and mobile number from the formData state
        const response = await axios.post(`${API_URL}/create-account`, { 
            name: fullName,
            phoneNumber: formData.mobileNumber 
        });
        setAccount(response.data);
        setMessage(`Account created successfully!`);
        navigateTo('dashboard');
    } catch (error) {
        setMessage('Error creating account. Please try again.');
    }
};

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage("Invalid amount.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/deposit`, { accountId: account.account_id, amount });
      setAccount(response.data);
      setMessage(`$${amount} deposited successfully. New balance: $${response.data.balance.toFixed(2)}`);
      setDepositAmount(''); // Clear the input field
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
    const amount = parseFloat(transactionAmount);
    const expense = transactionExpense;

    if (isNaN(amount) || amount <= 0 || !expense) {
      setMessage("Invalid transaction details.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/validate-transaction`, {
        accountId: account.account_id,
        amount,
        merchant: expense // Use 'merchant' for the backend call
      });

      if (response.data.approved) {
        setAccount(prevAccount => ({ ...prevAccount, balance: response.data.new_balance }));
        setMessage(`Transaction approved! New balance: $${response.data.new_balance.toFixed(2)}`);
      } else {
        setMessage(`Transaction declined. Reason: ${response.data.reason}`);
      }
      setTransactionAmount(''); // Clear the input fields
      setTransactionExpense('');
      navigateTo('dashboard');

    } catch (error) {
      setMessage("Error processing transaction.");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing-page':
        return (
          <div className="card">
            <h2>Welcome to Your HSA</h2>
            <p>The secure way to manage your healthcare expenses.</p>
            <button onClick={() => navigateTo('registration-step-1')} className="primary-btn">Create Account</button>
          </div>
        );

      case 'registration-step-1':
        return (
          <div className="card">
            <h2>Tell us about yourself</h2>
            <p className="subtitle">First, we'll need a few details</p>
            <div className="form-grid">
              <div className="form-field">
                <label>Full name</label>
                <input type="text" placeholder="First name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                <input type="text" placeholder="Middle name" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                <input type="text" placeholder="Last name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
              </div>
              <div className="form-field">
                <label>Social Security number</label>
                <input type="text" placeholder="Social Security number" name="ssn" value={formData.ssn} onChange={handleSsnChange} />
              </div>
              <div className="form-field">
                <label>Date of birth</label>
                <div className="date-input-group">
                  <input type="text" placeholder="Month" name="dobMonth" value={formData.dobMonth} onChange={handleInputChange} />
                  <input type="text" placeholder="Day" name="dobDay" value={formData.dobDay} onChange={handleInputChange} />
                  <input type="text" placeholder="Year" name="dobYear" value={formData.dobYear} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-field">
                <label>Country of citizenship</label>
                <input type="text" placeholder="Country of citizenship" name="citizenship" value={formData.citizenship} onChange={handleInputChange} />
              </div>
              <div className="form-field">
                <label>Mobile number</label>
                <input
                type="tel"
                placeholder="Phone Number (e.g., 555-555-5555)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>
            <div className="form-actions">
                <button onClick={() => navigateTo('landing-page')} className="link-btn">Exit</button>
                <button onClick={() => navigateTo('registration-step-2')} className="primary-btn">Next</button>
            </div>
          </div>
        );

      case 'registration-step-2':
        return (
            <div className="card">
                <h2>Where do you live?</h2>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Address</label>
                        <div className="address-group">
                        <input type="text" placeholder="Address line 1" name="address1" value={formData.address1} onChange={handleInputChange} />
                        <input type="text" placeholder="Address line 2 (optional)" name="address2" value={formData.address2} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="form-field form-row">
                        <div>
                            <label>City</label>
                            <input type="text" placeholder="City" name="city" value={formData.city} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label>State</label>
                            <input type="text" placeholder="State" name="state" value={formData.state} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label>ZIP Code</label>
                            <input type="text" placeholder="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
                <div className="form-actions">
                    <button onClick={() => navigateTo('registration-step-1')} className="link-btn">Back</button>
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
              <p className="small-text">Account ID: {account.account_id}</p>
            </div>
            <div className="button-grid">
              <button onClick={() => navigateTo('deposit-amount')} className="secondary-btn">
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
                <button onClick={() => navigateTo('make-transaction')} className="secondary-btn">
                  <i className="fa-solid fa-cart-shopping icon-sm"></i>
                  Make a Transaction
                </button>
              )}
            </div>
            <button onClick={handleReset} className="link-btn" style={{ marginTop: '2rem' }}>Reset App</button>
          </div>
        );

      case 'deposit-amount':
        return (
          <div className="card">
            <h2>Deposit Funds</h2>
            <p>Add virtual funds to your HSA to use for future medical expenses.</p>
            <div className="form-grid">
                <div className="form-field">
                    <label>Amount</label>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                    />
                </div>
            </div>
            <div className="form-actions">
                <button onClick={() => navigateTo('dashboard')} className="link-btn">Back to Dashboard</button>
                <button onClick={handleDeposit} className="primary-btn">Confirm Deposit</button>
            </div>
          </div>
        );

      case 'make-transaction':
        return (
            <div className="card">
                <h2>Make a Transaction</h2>
                <p>Enter the amount and a description for your transaction.</p>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Amount</label>
                        <input
                            type="number"
                            placeholder="Enter amount"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label>IRS-qualified medical expense</label>
                        <input
                            type="text"
                            placeholder="Enter expense"
                            value={transactionExpense}
                            onChange={(e) => setTransactionExpense(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button onClick={() => navigateTo('dashboard')} className="link-btn">Back to Dashboard</button>
                    <button onClick={handleValidateTransaction} className="primary-btn">Confirm Transaction</button>
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Health Savings Account App <i className="fa-solid fa-notes-medical"></i></h1>
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