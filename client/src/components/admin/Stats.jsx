import React, { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid,
  Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import { adminApi } from '../../config/adminApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Stats() {
  const [stats, setStats] = useState({
    appointmentsByMonth: [],
    revenueByMonth: [],
    serviceStats: [],
    peakHours: [],
    barberPerformance: [],
    customerRetention: [],
    loading: true,
    error: '',
    selectedTimeframe: 'month',
    selectedBarber: 'all'
  });

  const [barbers, setBarbers] = useState([]);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isBarberOpen, setIsBarberOpen] = useState(false);

  // Carica i barbieri al mount del componente
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchBarbers();
      // Carica le statistiche solo dopo aver caricato i barbieri
      await fetchStats();
    };
    loadInitialData();
  }, []);

  // Aggiorna le statistiche quando cambiano i filtri
  useEffect(() => {
    if (barbers.length > 0) { // Assicurati che i barbieri siano già caricati
      fetchStats();
    }
  }, [stats.selectedTimeframe, stats.selectedBarber]);

  // Debug
  useEffect(() => {
    console.log('Current state:', {
      barbers,
      selectedBarber: stats.selectedBarber,
      selectedTimeframe: stats.selectedTimeframe
    });
  }, [barbers, stats.selectedBarber, stats.selectedTimeframe]);

  const fetchBarbers = async () => {
    try {
      const response = await fetch('https://api.barbershop.dcreativo.ch/api/barbers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched barbers:', data);
      console.log('First barber structure:', data[0]);
      setBarbers(data);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: '' }));
      console.log('Fetching stats with:', { timeframe: stats.selectedTimeframe, barberId: stats.selectedBarber });

      // Ottieni i dati dal backend
      const response = await adminApi.getStats(stats.selectedTimeframe, stats.selectedBarber);
      console.log('Stats response:', response);

      // Formatta i dati in modo diverso in base al timeframe
      let appointmentsByMonth = [];
      let revenueByMonth = [];

      if (stats.selectedTimeframe === 'month' && response.appointmentsByDay) {
        // Per il mese, usa i dati giornalieri
        appointmentsByMonth = response.appointmentsByDay.map(item => ({
          name: `${item.day}`,
          Appuntamenti: item.count
        }));

        revenueByMonth = response.revenueByDay.map(item => ({
          name: `${item.day}`,
          Ricavi: item.revenue
        }));
      } else {
        // Per settimana e anno, usa i dati mensili standard
        appointmentsByMonth = response.appointmentsByMonth?.map(item => ({
          name: item.month,
          Appuntamenti: item.count
        })) || [];

        revenueByMonth = response.revenueByMonth?.map(item => ({
          name: item.month,
          Ricavi: item.revenue
        })) || [];
      }

      const formattedStats = {
        appointmentsByMonth,
        revenueByMonth,
        serviceStats: response.serviceStats || [],
        peakHours: response.peakHours || [],
        customerRetention: response.customerRetention || []
      };

      setStats(prev => ({
        ...prev,
        ...formattedStats,
        loading: false
      }));
    } catch (error) {
      console.error('Error in fetchStats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Errore nel caricamento delle statistiche. Riprova più tardi.'
      }));
    }
  };

  const getPeriodTitle = () => {
    switch(stats.selectedTimeframe) {
      case 'week': return 'Settimana';
      case 'month': return 'Mese';
      case 'year': return 'Anno';
      default: return 'Mese';
    }
  };

  if (stats.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
          <p className="mt-4 text-[var(--text-primary)]">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="bg-red-500/10 p-6 rounded-lg">
        <h3 className="text-red-500 font-bold mb-2">Errore</h3>
        <p className="text-red-500">{stats.error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-[var(--bg-primary)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-[var(--accent)]">Statistiche</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Custom Select per Barber */}
          <div className="relative">
            <button
              onClick={() => setIsBarberOpen(!isBarberOpen)}
              className="w-[200px] px-4 py-2 text-left bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)]"
            >
              {stats.selectedBarber === 'all' ? 'Tutti i barbieri' :
               (() => {
                 const barber = barbers.find(b => b._id === stats.selectedBarber);
                 return barber ? `${barber.firstName} ${barber.lastName}` : 'Seleziona barbiere';
               })()}
            </button>
            {isBarberOpen && (
              <div className="absolute z-50 w-[200px] mt-1 bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  className="px-4 py-2 hover:bg-[var(--accent)] cursor-pointer text-[var(--text-primary)]"
                  onClick={() => {
                    setStats(prev => ({ ...prev, selectedBarber: 'all' }));
                    setIsBarberOpen(false);
                  }}
                >
                  Tutti i barbieri
                </div>
                {barbers.map(barber => (
                  <div
                    key={barber._id}
                    className="px-4 py-2 hover:bg-[var(--accent)] cursor-pointer text-[var(--text-primary)]"
                    onClick={() => {
                      setStats(prev => ({ ...prev, selectedBarber: barber._id }));
                      setIsBarberOpen(false);
                    }}
                  >
                    {`${barber.firstName} ${barber.lastName}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Select per Timeframe */}
          <div className="relative">
            <button
              onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
              className="w-[200px] px-4 py-2 text-left bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)]"
            >
              {stats.selectedTimeframe === 'week' ? 'Questa settimana' :
              stats.selectedTimeframe === 'month' ? 'Questo mese' :
              'Quest\'anno'}
            </button>
            {isTimeframeOpen && (
              <div className="absolute z-40 w-[200px] mt-1 bg-[var(--bg-secondary)] border border-[var(--accent)] rounded-lg shadow-lg">
                <div
                  className="px-4 py-2 hover:bg-[var(--accent)] cursor-pointer text-[var(--text-primary)]"
                  onClick={() => {
                    setStats(prev => ({ ...prev, selectedTimeframe: 'week' }));
                    setIsTimeframeOpen(false);
                  }}
                >
                  Questa settimana
                </div>
                <div
                  className="px-4 py-2 hover:bg-[var(--accent)] cursor-pointer text-[var(--text-primary)]"
                  onClick={() => {
                    setStats(prev => ({ ...prev, selectedTimeframe: 'month' }));
                    setIsTimeframeOpen(false);
                  }}
                >
                  Questo mese
                </div>
                <div
                  className="px-4 py-2 hover:bg-[var(--accent)] cursor-pointer text-[var(--text-primary)]"
                  onClick={() => {
                    setStats(prev => ({ ...prev, selectedTimeframe: 'year' }));
                    setIsTimeframeOpen(false);
                  }}
                >
                  Quest'anno
                </div>
              </div>
            )}
          </div>

          <button
            onClick={fetchStats}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            Aggiorna
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-2">Appuntamenti Totali</h3>
          <p className="text-4xl font-bold text-[var(--accent)]">
            {stats.appointmentsByMonth.reduce((acc, curr) => acc + curr.Appuntamenti, 0)}
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-2">Ricavo Totale</h3>
          <p className="text-4xl font-bold text-[var(--accent)]">
            CHF {stats.revenueByMonth.reduce((acc, curr) => acc + curr.Ricavi, 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-2">Clienti Fidelizzati</h3>
          <p className="text-4xl font-bold text-[var(--accent)]">
            {stats.customerRetention.reduce((acc, curr) =>
              curr.name !== '1 visita' ? acc + curr.value : acc, 0
            )}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">
            {stats.selectedTimeframe === 'month'
              ? 'Appuntamenti Giornalieri'
              : `Appuntamenti per ${getPeriodTitle()}`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.appointmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Appuntamenti"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: "var(--accent)" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">
            {stats.selectedTimeframe === 'month'
              ? 'Ricavi Giornalieri'
              : `Ricavi per ${getPeriodTitle()}`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => [`CHF ${value}`, 'Ricavi']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Ricavi"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dot={{ fill: "#4CAF50" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">Fasce Orarie Popolari</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.peakHours}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  name="Appuntamenti"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">Fidelizzazione Clienti</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.customerRetention}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.customerRetention.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => [`${value}`, 'Clienti']}
                />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium mb-4">Popolarità Servizi</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.serviceStats}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-primary)' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  name="Prenotazioni"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
