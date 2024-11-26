import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Line, Pie } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const navigate = useNavigate();
  const [pieData, setPieData] = useState(null);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        navigate('/');
        return null;
      }

      const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        return data.access;
      } else {
        navigate('/');
        return null;
      }
    } catch {
      navigate('/');
      return null;
    }
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/');
        return;
      }

      let response = await fetch('http://127.0.0.1:8000/api/user/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return;

        response = await fetch('http://127.0.0.1:8000/api/user/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch {
      navigate('/');
    }
  }, [refreshAccessToken, navigate]);

  /**
 * The fetches transaction function fetches transactions for the selected month from the backend.
 * Queries the API with the start and end dates of the current month.
 * Updates state with transaction data and generates calendar data.
 */

  const fetchTransactions = useCallback(async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      let accessToken = localStorage.getItem('accessToken');



      let response = await fetch(
        `http://127.0.0.1:8000/api/transactions/?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 401) {
        accessToken = await refreshAccessToken();
        if (!accessToken) return;

        response = await fetch(
          `http://127.0.0.1:8000/api/transactions/?start_date=${startDate}&end_date=${endDate}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        generateCalendarData(data.transactions);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, refreshAccessToken, navigate]);

  
  /**
 * handleConnectAccount function:
 * Connects the user’s bank account using Plaid.
 * Opens a Plaid link modal and exchanges the public token for an access token.
 * Fetches transactions after a successful connection.
 */


  const handleConnectAccount = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/create_link_token/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLinkToken(data.link_token);

        const plaid = window.Plaid.create({
          token: data.link_token,
          onSuccess: async (publicToken) => {
            const exchangeResponse = await fetch('http://127.0.0.1:8000/api/exchange_public_token/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ public_token: publicToken }),
            });

            if (exchangeResponse.ok) {
              fetchTransactions();
            }
          },
        });

        plaid.open();
      } else {
        throw new Error('Failed to fetch link token');
      }
    } catch (err) {
      console.error(err);
    }
  };


  /**
 * fetchPlatFormData function:
 * Fetches profit data grouped by platform from the backend.
 * Updates state to populate the pie chart with platform-specific winnings data.
 * Handles errors gracefully if the API fails.
 */

  const fetchPlatformData = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch('http://127.0.0.1:8000/api/transactions/profit-by-platform', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
            const data = await response.json();

            
            const platforms = data.profit_by_platform || [];
            const labels = platforms.map((p) => p.platform || 'Other');
            const profits = platforms.map((p) => Math.abs(p.net_profit));

            setPieData({
                labels,
                datasets: [
                    {
                        label: 'Total Winnings by Platform',
                        data: profits,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        } else {
            console.error('Failed to fetch platform data');
        }
    } catch (error) {
        console.error('Error fetching platform data:', error);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      fetchPlatformData(); // Ensure platform data fetches after transactions load
    }
  }, [transactions]); // Re-fetch platform data if transactions update
  
  /**
 * simulateTransactions function:
 * Simulates transaction data for the selected month.
 * Sends the current month/year to the backend to generate dummy transactions.
 * Refreshes the transaction list after simulation.
 */


  const simulateTransactions = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const selectedMonth = currentMonth.getMonth() + 1; // JavaScript months are zero-based
      const selectedYear = currentMonth.getFullYear();
      const response = await fetch('http://127.0.0.1:8000/api/simulate_transactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }), // Send selected month/year
      });

      if (response.ok) {
        fetchTransactions(); // Refresh transactions after simulation
      } else {
        throw new Error('Failed to simulate transactions');
      }
    } catch (err) {
      console.error(err);
    }
  };


  /**
 * clearTransactions function: 
 * Clears all transactions for the current user.
 * Updates the UI to reflect an empty state.
 * Logs any errors that occur during the process.
 */

  const clearTransactions = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('http://127.0.0.1:8000/api/clear_transactions/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setTransactions([]);
        setCalendarData({});
        setPieData(null);
      } else {
        throw new Error('Failed to clear transactions');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotalProfit = () => {
    let deposits = 0;
    let withdrawals = 0;

    transactions.forEach((txn) => {
      if (txn.transaction_type === 'deposit') {
        deposits += Number(txn.amount);
      } else if (txn.transaction_type === 'withdrawal') {
        withdrawals += Number(txn.amount);
      }
    });

    return withdrawals - deposits;
  };

  /**
 * generate CalendarData function: 
 * Generates data for the calendar view based on transactions.
 * Groups transactions by date, calculates net profit/loss, and assigns a color label.
 * Example: Green for profit, Red for loss, Gray for no activity.
 */

  const generateCalendarData = (transactions) => {
    const calendar = {};
    console.log(`Generating calendar data for transactions:`, transactions); // Debug log: Inspect transactions

  
    // Group transactions by date and calculate the net profit for each day
    transactions.forEach((txn) => {
      const date = txn.date;
      const amount = txn.transaction_type === 'withdrawal' ? Number(txn.amount) : -Number(txn.amount);
  
      if (!calendar[date]) {
        calendar[date] = {
          amount: 0,
          transactions: [],
        };
      }
  
      calendar[date].amount += amount;
      calendar[date].transactions.push(txn);
    });
  
    // Format each day's data for the calendar
    for (const date in calendar) {
      const amount = calendar[date].amount;
      calendar[date] = {
        amount,
        color: amount > 0 ? 'green' : amount < 0 ? 'red' : 'gray',
        label: amount > 0 ? `+ $${amount}` : amount < 0 ? `- $${Math.abs(amount)}` : `$0`,
        transactions: calendar[date].transactions,
      };
    }
    console.log(`Generated calendar data:`, calendar); // Debug log: Inspect calendar data
    setCalendarData(calendar);
  };
  

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };

  const handleDateClick = (date) => {
    console.log(`Clicked date: ${date}`); // Debug log: Check the clicked date
    const dayData = calendarData[date] || {};
    console.log(`Day data for ${date}:`, dayData); // Debug log: Inspect day data
    setSelectedDate(date);
    setSelectedTransactions(dayData.transactions || []);
  };

  /**
 * Fetch user details and transactions when the component is mounted
 * or when dependencies (fetchUser, fetchTransactions) change.
 */
  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, [fetchUser, fetchTransactions]);

  const weeklyData = { 1: 0, 2: 0, 3: 0, 4: 0 };
  transactions.forEach((txn) => {
    const weekNumber = Math.ceil(new Date(txn.date).getDate() / 7);
    if (weeklyData[weekNumber] !== undefined) {
      weeklyData[weekNumber] += Number(txn.net_amount) || 0;
    }
  });

  const graphData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Net Balance (CAD)',
        data: [weeklyData[1], weeklyData[2], weeklyData[3], weeklyData[4]],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-4">
    <h2 className="text-xl font-bold mb-4">Total Winnings by Platform</h2>
    {pieData ? (
      <>
        <Pie data={pieData} />
      </>
    ) : (
      <p>Loading chart data...</p>
    )}
  </div>
  

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        suggestedMin: Math.min(...Object.values(weeklyData)) - 50,
        suggestedMax: Math.max(...Object.values(weeklyData)) + 50,
      },
    },
  };

  // Calculate total deposits for the current month
  const deposits = transactions
  .filter(
    (txn) =>
      new Date(txn.date).getMonth() === currentMonth.getMonth() &&
      new Date(txn.date).getFullYear() === currentMonth.getFullYear() &&
      txn.transaction_type === 'deposit'
  )
  .reduce((acc, txn) => acc + Number(txn.amount), 0);

  // Use existing profit calculation
  const profit = transactions
  .filter(
    (txn) =>
      new Date(txn.date).getMonth() === currentMonth.getMonth() &&
      new Date(txn.date).getFullYear() === currentMonth.getFullYear()
  )
  .reduce((acc, txn) => {
    if (txn.transaction_type === 'withdrawal') {
      return acc + Number(txn.amount);
    } else if (txn.transaction_type === 'deposit') {
      return acc - Number(txn.amount);
    }
    return acc;
  }, 0);

  // Calculate ROI only if deposits are greater than zero
  const roi = deposits > 0 ? (profit / deposits) * 100 : null;


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.username || 'User'}!</h1>
            <br />
            <div className="flex gap-4">
              <button
                onClick={handleConnectAccount}
                className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold px-4 py-2 rounded-lg"
              >
                + Connect Account
              </button>
              <button
                onClick={simulateTransactions}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg"
              >
                Simulate Transactions
              </button>
              <button
                onClick={() => {
                  clearTransactions();
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg"
              >
                Clear Transactions
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </header>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Calendar</h2>
            <div className="flex justify-between mb-4">
              <button
                onClick={handlePreviousMonth}
                className="bg-gray-700 px-4 py-2 rounded-lg text-white"
              >
                Previous
              </button>
              <h3 className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
              <button
                onClick={handleNextMonth}
                className="bg-gray-700 px-4 py-2 rounded-lg text-white"
              >
                Next
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Loop through the days in the selected month and render each day */}
              {Array.from({
                length: new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  0
                ).getDate(),
              }).map((_, index) => {
                const date = format(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    index + 1
                  ),
                  'yyyy-MM-dd'
                );
                const dayData = calendarData[date] || { color: 'gray', label: '$0' };
                return (
                  <div
                    key={index}
                    className={`relative p-2 rounded-lg cursor-pointer hover:bg-gray-600 ${
                      dayData.color === 'green'
                        ? 'bg-green-300 text-green-700'
                        : dayData.color === 'red'
                        ? 'bg-red-300 text-red-700'
                        : 'bg-gray-300 text-gray-700'
                    } hover:bg-opacity-75`}
                    onClick={() => handleDateClick(date)}
                  >
                    <p className="absolute top-1 left-1 text-xs font-bold">{index + 1}</p>
                    <p className="text-sm">{dayData.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
  
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Net Balance (Weekly)</h2>
            <Line data={graphData} options={options} />
          </div>
        </div>
        

              
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-1/3">
              <h2 className="text-xl font-bold mb-4">Transaction History</h2>
              <h3 className="text-lg font-semibold mb-2">Date: {selectedDate}</h3>
              {selectedTransactions.length > 0 ? (
                <ul>
                  {selectedTransactions.map((txn, index) => (
                    <li key={index} className="mb-2">
                      {txn.transaction_type === 'deposit' ? (
                        <span className="text-white">
                          Deposit of ${txn.amount} via {txn.platform}
                        </span>
                      ) : (
                        <span className="text-white">
                          Withdrawal of ${txn.amount} via {txn.platform}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No transactions for this date.</p>
              )}
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedTransactions([]);
                }}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Combined Bubble for Total Stats and Transaction Trends */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            
            <h2 className="text-xl font-bold mb-3">Monthly Account Summary</h2>
            {/* Total Profit/Deposit/Withdrawals */}
            <p
              className={`text-lg font-bold ${
                calculateTotalProfit() > 0
                  ? 'text-green-500'
                  : calculateTotalProfit() < 0
                  ? 'text-red-500'
                  : 'text-white'
              }`}
            >
              {`Total Profit: ${
                calculateTotalProfit() > 0
                  ? '+ $'
                  : calculateTotalProfit() === 0
                  ? '$'
                  : '- $'
              }${Math.abs(calculateTotalProfit())}`}
            </p>
            <p className="text-lg font-bold text-white">
              {`Total Deposits: $${transactions
                .filter(
                  (txn) =>
                    new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                    new Date(txn.date).getFullYear() === currentMonth.getFullYear() &&
                    txn.transaction_type === 'deposit'
                )
                .reduce((acc, txn) => acc + Number(txn.amount), 0)}`}

              
            </p>
            <p className="text-lg font-bold text-white">
              {`Total Withdrawals: $${transactions
                .filter(
                  (txn) =>
                    new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                    new Date(txn.date).getFullYear() === currentMonth.getFullYear() &&
                    txn.transaction_type === 'withdrawal'
                )
                .reduce((acc, txn) => acc + Number(txn.amount), 0)}`}
            </p>

            

            <p className="text-lg font-bold text-white">
              {`ROI for the Month: ${roi !== null ? `${roi.toFixed(2)}%` : 'N/A'}`}
            </p>

            <hr className="my-4 border-gray-600" />
            <h1 className="text-lg font-bold text-white mb-2">
              Transaction Trends this Month
            </h1>
            <p className="text-lg font-bold">
              {`Top Platform: ${
                transactions
                  .filter(
                    (txn) =>
                      new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                      new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                  )
                  .reduce((platforms, txn) => {
                    platforms[txn.platform] =
                      (platforms[txn.platform] || 0) + Number(txn.amount);
                    return platforms;
                  }, {})
                  ? Object.entries(
                      transactions
                        .filter(
                          (txn) =>
                            new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                            new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                        )
                        .reduce((platforms, txn) => {
                          platforms[txn.platform] =
                            (platforms[txn.platform] || 0) + Number(txn.amount);
                          return platforms;
                        }, {})
                    ).reduce(
                      (max, platform) =>
                        max[1] > platform[1] ? max : platform,
                      ['N/A', 0]
                    )[0]
                  : 'N/A'
              }`}
            </p>
            <p className="text-lg font-bold">
              {`Biggest Profit Day: ${
                transactions
                  .filter(
                    (txn) =>
                      new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                      new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                  )
                  .reduce(
                    (max, txn) =>
                      txn.amount > max.amount ? { date: txn.date, amount: txn.amount } : max,
                    { date: 'N/A', amount: -Infinity }
                  ).date !== 'N/A'
                  ? format(
                      new Date(
                        transactions
                          .filter(
                            (txn) =>
                              new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                              new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                          )
                          .reduce(
                            (max, txn) =>
                              txn.amount > max.amount
                                ? { date: txn.date, amount: txn.amount }
                                : max,
                            { date: 'N/A', amount: -Infinity }
                          ).date
                      ),
                      'EEEE, MMMM d'
                    )
                  : 'N/A'
              }`}
            </p>
            <p className="text-lg font-bold">
              {`Biggest Loss Day: ${
                transactions
                  .filter(
                    (txn) =>
                      new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                      new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                  )
                  .reduce(
                    (min, txn) =>
                      txn.amount < min.amount ? { date: txn.date, amount: txn.amount } : min,
                    { date: 'N/A', amount: Infinity }
                  ).date !== 'N/A'
                  ? format(
                      new Date(
                        transactions
                          .filter(
                            (txn) =>
                              new Date(txn.date).getMonth() === currentMonth.getMonth() &&
                              new Date(txn.date).getFullYear() === currentMonth.getFullYear()
                          )
                          .reduce(
                            (min, txn) =>
                              txn.amount < min.amount
                                ? { date: txn.date, amount: txn.amount }
                                : min,
                            { date: 'N/A', amount: Infinity }
                          ).date
                      ),
                      'EEEE, MMMM d'
                    )
                  : 'N/A'
              }`}
            </p>
          </div>
  
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Total Winnings by Platform</h2>
            {pieData ? (
              <div className="flex justify-center">
                <div style={{ width: '300px', height: '300px' }}>
                  <Pie data={pieData} />
                </div>
              </div>
            ) : (
              // Show a loading message or default text if no pie chart data is available
              <p className="text-center">No Data Available...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  

};
export default Dashboard;
  