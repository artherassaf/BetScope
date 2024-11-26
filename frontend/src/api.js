import axios from 'axios'; // Import axios library for HTTP requests

const BASE_URL = 'http://localhost:8000/bets'; // Base URL pointing to Django server's /bets path

/**
 * Add a new transaction to the backend.
 * @param {Object} transaction - The transaction data to be added.
 * @returns {Object} The response data from the backend.
 */
export const addTransaction = async (transaction) => {
  try {
    const response = await axios.post(`${BASE_URL}/add/`, transaction);
    return response.data;
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error; // Propagate error for further handling
  }
};

/**
 * Fetch all transactions from the backend.
 * @returns {Array} The list of transactions.
 */
export const getTransactions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/all/`);
    return response.data.transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error; // Propagate error for further handling
  }
};

/**
 * Register a new user in the backend.
 * @param {string} username - The username for the new user.
 * @param {string} password - The password for the new user.
 * @returns {Object} The response data from the backend.
 */
export const registerUser = async (username, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/signup/`, { username, password });
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw error.response?.data || error; // Propagate error for frontend to display
  }
};

/**
 * Fetch profit data by platform from the backend.
 * @returns {Array} The profit data by platform.
 */
export const getProfitByPlatform = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/profit-by-platform/`); // Fixed endpoint
    return response.data.profit_by_platform;
  } catch (error) {
    console.error("Error fetching profit by platform:", error);
    throw error; // Propagate error for further handling
  }
};
