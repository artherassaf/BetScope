# BetScope 

BetScope is a web application designed to help users track their betting transactions and visualize profits/losses. This project demonstrates the core functionalities of a betting tracker, focusing on data visualization, transaction logging, and an interactive user interface.

---

## Features

- **Interactive Calendar**: Track daily transactions and view net profits/losses.
- **Analytics Dashboard**: Get insights into your betting habits with charts and summaries.
- **Simulated Transactions**: Add sample transactions for testing and visualization.
- **Plaid Integration (Demo)**: Use Plaid's sandbox environment to simulate account connections and retrieve transactions.

---

## Current Limitations

This project is currently a **demo** due to the following constraints:
1. **Plaid Integration**: Full functionality is unavailable because Plaid's production API is not enabled (due to cost constraints). You can use the sandbox environment with `user_good` and `pass_good`, but note that no real betting data is included.
2. **No Production Deployment**: The app is not hosted online, so it must be run locally for now.
3. **Limited Dataset**: Testing features are designed for simulated data only, as real-world data integration isn't supported yet.

These limitations will be addressed in future updates.

---

### Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager)
- **Python** (for the backend API)
- Plaid sandbox account (optional for simulating account connections)

---

### Installation

Follow these steps to set up and run the application locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/betscope.git
   cd betscope

2. **Install frontend dependencies**:
   cd frontend
   ```bash
   npm install

3. **Set up the backend**:
   cd backend
   python -m venv venv
   source venv/bin/activate  
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver

3. **Start the frontend**:
    cd frontend
    npm start

---

## How to Use

1. **Simulate Transactions**:
   - Log in with any username and password to access the demo environment.
   - Use the "Simulate Transactions" button on the dashboard to generate sample data.

2. **Connect to Plaid (Optional)**:
   - Use sandbox credentials (`user_good`, `pass_good`) to connect a test account.

3. **View Analytics**:
   - Explore the dashboard to analyze your betting activity using interactive charts and 
     summaries.

4. **Clear Transactions**:
   - Use the "Clear Transactions" button to reset the data.

---

## Project Structure

1. **Backend**: Handles the API for transaction management and integration with Plaid.
2. **Frontend**: A React-based interface for users to interact with the app.
3. **Shared Dependencies**: Ensures seamless communication between the frontend and backend.

---

## Technologies Used

This project utilizes the following technologies:

### Frontend:
- **React**: For building the user interface.
- **Chart.js**: For creating interactive charts and data visualizations.
- **Tailwind CSS**: For styling the application and creating responsive designs.

### Backend:
- **Django**: For building the API and handling data processing.
- **Django REST Framework (DRF)**: For creating RESTful endpoints.
- **Plaid API (Sandbox)**: For simulating banking data and transactions.

### Database:
- **SQLite**: Used for local development and data storage.

### Development Tools:
- **Node.js**: For managing frontend dependencies.
- **npm**: For managing JavaScript packages.
- **Python**: For backend development and scripting.
- **Git**: For version control.

---

### Future Improvements:

1. Enable Plaid's production API for real-world usage.
2. Deploy the application online for easier access.
3. Add real betting data support and detailed insights.
4. Improve authentication and multi-user support.










