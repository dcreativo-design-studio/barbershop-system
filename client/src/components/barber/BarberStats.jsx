import { AlertCircle, ArrowDown, ArrowUp, Calendar, Clock, DollarSign, Scissors, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { barberApi } from '../../config/barberApi';

// Array di colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8', '#82CA9D'];

function BarberStats({ barberId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    if (barberId) {
      fetchStats();
    }
  }, [barberId, timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await barberApi.getBarberStats(barberId, timeframe);
      setStats(response);

    } catch (error) {
      console.error('Error fetching barber stats:', error);
      setError('Errore nel caricamento delle statistiche. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Helpers per formattare i dati
  const formatCurrency = (value) => {
    return `CHF ${value.toFixed(2)}`;
  };

  const getPercentageChange = (current, previous) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  const formatServiceData = (services) => {
    if (!services || !Array.isArray(services)) return [];

    return services.map((service, index) => ({
      name: service.name || service.service, // Aggiungiamo service come fallback
      value: service.count,
      percentage: service.count || 0,
      color: COLORS[index % COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg">Nessuna statistica disponibile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--accent)]">
          Statistiche
        </h2>

        <div className="flex bg-[var(--bg-primary)] p-1 rounded-lg">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 rounded-md ${
              timeframe === 'week'
                ? 'bg-[var(--accent)] text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Settimana
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 rounded-md ${
              timeframe === 'month'
                ? 'bg-[var(--accent)] text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Mese
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1 rounded-md ${
              timeframe === 'year'
                ? 'bg-[var(--accent)] text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
          >
            Anno
          </button>
        </div>
      </div>

      {/* Card di riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Appuntamenti totali */}
        <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Appuntamenti</p>
              <p className="text-2xl font-bold mt-1">{stats.appointments?.total || 0}</p>

              {stats.appointments?.previousPeriod !== undefined && (
                <div className={`flex items-center mt-2 text-sm ${
                  getPercentageChange(stats.appointments?.total, stats.appointments?.previousPeriod) > 0
                    ? 'text-green-500'
                    : getPercentageChange(stats.appointments?.total, stats.appointments?.previousPeriod) < 0
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}>
                  {getPercentageChange(stats.appointments?.total, stats.appointments?.previousPeriod) > 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : getPercentageChange(stats.appointments?.total, stats.appointments?.previousPeriod) < 0 ? (
                    <ArrowDown className="w-4 h-4 mr-1" />
                  ) : (
                    <span className="w-4 h-4 mr-1">-</span>
                  )}
                  <span>
                    {Math.abs(getPercentageChange(stats.appointments?.total, stats.appointments?.previousPeriod) || 0).toFixed(1)}% rispetto al periodo precedente
                  </span>
                </div>
              )}
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Card: Fatturato */}
        <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Fatturato</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.revenue?.total || 0)}</p>

              {stats.revenue?.previousPeriod !== undefined && (
                <div className={`flex items-center mt-2 text-sm ${
                  getPercentageChange(stats.revenue?.total, stats.revenue?.previousPeriod) > 0
                    ? 'text-green-500'
                    : getPercentageChange(stats.revenue?.total, stats.revenue?.previousPeriod) < 0
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}>
                  {getPercentageChange(stats.revenue?.total, stats.revenue?.previousPeriod) > 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : getPercentageChange(stats.revenue?.total, stats.revenue?.previousPeriod) < 0 ? (
                    <ArrowDown className="w-4 h-4 mr-1" />
                  ) : (
                    <span className="w-4 h-4 mr-1">-</span>
                  )}
                  <span>
                    {Math.abs(getPercentageChange(stats.revenue?.total, stats.revenue?.previousPeriod) || 0).toFixed(1)}% rispetto al periodo precedente
                  </span>
                </div>
              )}
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Card: Durata media */}
        <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Durata Media</p>
              <p className="text-2xl font-bold mt-1">{(stats.duration?.average || 0).toFixed(0)} min</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Card: Servizio più popolare */}
        <div className="bg-[var(--bg-primary)] p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Servizio Più Popolare</p>
              <p className="text-lg font-bold mt-1 truncate">{stats.mostPopularService?.name || 'N/A'}</p>
              <p className="text-sm text-gray-400">
                {stats.mostPopularService?.count || 0} prenotazioni
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Scissors className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Grafico: Andamento appuntamenti */}
      {stats.appointmentsByPeriod && stats.appointmentsByPeriod.length > 0 && (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Andamento Appuntamenti</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.appointmentsByPeriod}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="period"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="#888"
                />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#333',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill="#0088FE" barSize={timeframe === 'year' ? 25 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grafico: Distribuzione servizi */}
      {stats.serviceDistribution && stats.serviceDistribution.length > 0 && (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Distribuzione Servizi</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
              data={formatServiceData(stats.serviceDistribution)}
              cx="50%"
              cy="50%"
              labelLine
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, value, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {formatServiceData(stats.serviceDistribution).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} prenotazioni`, name]}
              contentStyle={{
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff'
              }}
            />
            <Legend />
          </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grafico: Fatturato per periodo */}
      {stats.revenueByPeriod && stats.revenueByPeriod.length > 0 && (
        <div className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-6">Fatturato per Periodo</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.revenueByPeriod}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="period"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="#888"
                />
                <YAxis stroke="#888" />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Fatturato']}
                  contentStyle={{
                    backgroundColor: '#333',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="amount" fill="#00C49F" barSize={timeframe === 'year' ? 25 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarberStats;
