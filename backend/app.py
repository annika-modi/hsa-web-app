from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid 
import random

app = Flask(__name__)
CORS(app) 

data = {
    "users": {},
    "accounts": {},
    "cards": {}
}

# --- MAIN FEATURES ---

@app.route('/api/create-account', methods=['POST'])
def create_account():
    user_info = request.json
    user_id = str(uuid.uuid4())
    account = {
        "account_id": f"hsa-{user_id}",
        "owner_name": user_info.get('name'),
        "balance": 0, 
        "card_issued": False
    }
    data["accounts"][user_id] = account
    return jsonify(account), 201

@app.route('/api/deposit', methods=['POST'])
def deposit_funds():
    deposit_info = request.json
    account_id = deposit_info.get('accountId')
    amount = deposit_info.get('amount')

    # Find the account (in a real app, you'd query a DB)
    for user_id, account in data["accounts"].items():
        if account["account_id"] == account_id:
            account["balance"] += amount
            return jsonify(account)
    return jsonify({"error": "Account not found"}), 404

@app.route('/api/issue-card', methods=['POST'])
def issue_card():
    card_info = request.json
    account_id = card_info.get('accountId')

    for user_id, account in data["accounts"].items():
        if account["account_id"] == account_id:
            account["card_issued"] = True
            #generate a random card
            card_number = ' '.join([''.join([str(random.randint(0, 9)) for _ in range(4)]) for _ in range(4)])
            
            card = {
                "card_number": card_number,
                "cvv": "123", 
                "expiry": "12/29", 
                "linked_account": account_id
            }
            data["cards"][account_id] = card
            return jsonify({"card": card, "account": account})
    return jsonify({"error": "Account not found"}), 404

@app.route('/api/validate-transaction', methods=['POST'])
def validate_transaction():
    transaction_info = request.json
    account_id = transaction_info.get('accountId')
    amount = transaction_info.get('amount')
    merchant = transaction_info.get('merchant')

    QUALIFIED_MERCHANTS = ["CVS Pharmacy", "Walgreens", "Doctor's Office"]

    account = next((acc for acc in data["accounts"].values() if acc["account_id"] == account_id), None)

    if not account:
        return jsonify({"approved": False, "reason": "Account not found"}), 404
    if account["balance"] < amount:
        return jsonify({"approved": False, "reason": "Insufficient funds"})
    if merchant not in QUALIFIED_MERCHANTS:
        return jsonify({"approved": False, "reason": f"{merchant} is not a qualified medical expense."})

    account["balance"] -= amount
    return jsonify({
        "approved": True, 
        "reason": "Transaction approved!", 
        "new_balance": account["balance"]
    })

if __name__ == '__main__':
    app.run(debug=True) # Runs the server on http://127.0.0.1:5000