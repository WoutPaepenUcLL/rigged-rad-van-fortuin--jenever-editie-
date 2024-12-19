import  { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface HourlyStat {
  hour: string;
  count: number;
}

interface SpinStatistics {
  total_spins: number;
  distribution: { [key: string]: number };
  hourly_stats: HourlyStat[];
}

// interface WheelConfig {
//   name: string;
//   chance: number;
// }

const AdminDashboard = () => {
  const [wheelConfig, setWheelConfig] = useState<any[]>([]);
  const [spinStatistics, setSpinStatistics] = useState<SpinStatistics>({
    total_spins: 0,
    distribution: {},
    hourly_stats: [],
  });
  const apiUrl = "http://localhost:8000"
  const [drinkCount, setDrinkCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wheel configuration
        const configResponse = await fetch(`${apiUrl}/admin/wheel-config`);
        const configData = await configResponse.json();
        setWheelConfig(configData.items); 
        // Fetch spin statistics
        const statsResponse = await fetch(`${apiUrl}/admin/statistics`);
        const statsData = await statsResponse.json();
        setSpinStatistics(statsData);

        // Fetch drink count
        const drinkCountResponse = await fetch(`${apiUrl}/drink/count`);
        console.log('url:')
        console.log(apiUrl)
        const drinkCountData = await drinkCountResponse.json();
        setDrinkCount(drinkCountData.drink_count);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  useEffect(() => {
    // Initialize SocketIO connection
    const newSocket = io('http://localhost:8000');
  
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });
  
    newSocket.on('drink_count_update', (data) => {
      console.log('Drink count update received:', data);
      setDrinkCount(data.count);
    });
  
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  
    // Cleanup function: Return a function that closes the socket
    return () => {
      console.log("Closing socket");
      newSocket.close();
    };
  }, []); // Empty dependency array 

  const updateWheelChances = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/wheel-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: wheelConfig })
      });

      if (!response.ok) {
        throw new Error('Failed to update wheel configuration');
      }

      console.log("Wheel configuration updated successfully");
    } catch (error) {
      console.error("Error updating wheel configuration:", error);
    }
  };

  const incrementDrinkCount = async () => {
    try {
      const response = await fetch(`${apiUrl}/drink-counter/increment`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to increment drink count');
      }

      const data = await response.json();
      setDrinkCount(data.drink_count); // Update state with the returned value

    } catch (error) {
      console.error("Error incrementing drink count:", error);
    }
  };

  const formatHourlyStats = () => {
    if (spinStatistics.hourly_stats) {
      return spinStatistics.hourly_stats.map(stat => ({
        name: stat.hour.slice(0, -3),
        spins: stat.count,
      }));
    } else {
      return [];
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen`}>
    <div className="p-8 bg-gray-100 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
        <button onClick={toggleDarkMode} className="bg-gray-500 text-white px-4 py-2 rounded">
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Wheel Configuration */}
        <div className="bg-white dark:bg-gray-700 shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Wheel Item Chances</h2>
          {wheelConfig.map((item, index) => (
            <div key={item.name} className="mb-2">
              <label className="text-gray-700 dark:text-gray-300">{item.name}</label>
              <input
                type="number"
                value={item.chance}
                onChange={(e) => {
                  const newConfig = [...wheelConfig];
                  newConfig[index].chance = parseFloat(e.target.value);
                  setWheelConfig(newConfig);
                }}
                min="0"
                max="100"
                step="0.1"
                className="ml-2 w-20 border rounded p-1 text-gray-800 dark:text-gray-200 dark:bg-gray-600"
              />
            </div>
          ))}
          <button
            onClick={updateWheelChances}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Update Chances
          </button>
        </div>

        {/* Drink Counter */}
        <div className="bg-white dark:bg-gray-700 shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Drink Sales</h2>
          <div className="text-4xl font-bold text-center text-gray-800 dark:text-gray-200">{drinkCount}</div>
          <button
            onClick={incrementDrinkCount}
            className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Sale
          </button>
        </div>

        {/* Spin Statistics */}
        <div className="col-span-2 bg-white dark:bg-gray-700 shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Spin Statistics</h2>
          <div>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Total Spins:</strong> {spinStatistics.total_spins}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Distribution:</strong>
            </p>
            <ul>
              {Object.entries(spinStatistics.distribution).map(([itemName, count]) => (
                <li key={itemName} className="text-gray-700 dark:text-gray-300">
                  {itemName}: {count}
                </li>
              ))}
            </ul>
          </div>
          <h3 className="text-l font-semibold mb-4 text-gray-800 dark:text-gray-200">Hourly Stats</h3>
          <LineChart width={600} height={300} data={formatHourlyStats()}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#666' : '#ccc'} />
            <XAxis dataKey="name" stroke={isDarkMode ? '#ddd' : '#666'} />
            <YAxis stroke={isDarkMode ? '#ddd' : '#666'} />
            <Tooltip
              contentStyle={{ backgroundColor: isDarkMode ? '#444' : '#fff', borderColor: isDarkMode ? '#999' : '#ccc' }}
              labelStyle={{ color: isDarkMode ? '#eee' : '#000' }}
              itemStyle={{ color: isDarkMode ? '#eee' : '#000' }}
            />
            <Legend wrapperStyle={{ color: isDarkMode ? '#ddd' : '#666' }} />
            <Line type="monotone" dataKey="spins" stroke="#8884d8" />
          </LineChart>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AdminDashboard;