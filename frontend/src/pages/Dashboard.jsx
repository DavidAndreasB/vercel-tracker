import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, TrendingDown, Landmark, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = ['#63e1d1', '#818cf8', '#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a855f7', '#fb923c'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const result = await dashboardAPI.get();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <h3>Unable to load dashboard</h3>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  const incomeBreakdown = data.category_breakdown?.filter(c => c.type === 'income') || [];
  const expenseBreakdown = data.category_breakdown?.filter(c => c.type === 'expense') || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your financial overview for this month</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Net Worth</span>
            <div className="card-icon net-worth">
              <Landmark size={22} />
            </div>
          </div>
          <div className="card-value">{formatCurrency(data.total_net_worth || 0)}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Income</span>
            <div className="card-icon income">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="card-value" style={{ color: 'var(--success)' }}>
            +{formatCurrency(data.current_month_income || 0)}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Expense</span>
            <div className="card-icon expense">
              <TrendingDown size={22} />
            </div>
          </div>
          <div className="card-value" style={{ color: 'var(--danger)' }}>
            -{formatCurrency(data.current_month_expense || 0)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Expense Breakdown Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Expense Breakdown</h3>
          </div>
          {expenseBreakdown.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {expenseBreakdown.map((cat, i) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{cat.name}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <p>No expenses this month</p>
            </div>
          )}
        </div>

        {/* Income Breakdown Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Income Breakdown</h3>
          </div>
          {incomeBreakdown.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {incomeBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {incomeBreakdown.map((cat, i) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-sm)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{cat.name}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <p>No income this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallets Overview */}
      {data.wallets && data.wallets.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="chart-header">
            <h3 className="chart-title">Wallets</h3>
            <Wallet size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {data.wallets.map((wallet) => (
              <div
                key={wallet.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-glass)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className={`badge badge-${wallet.type}`}>
                    {wallet.type === 'bank' ? '🏦' : wallet.type === 'ewallet' ? '📱' : '💵'}
                    {' '}{wallet.type}
                  </span>
                  <span style={{ fontWeight: 600 }}>{wallet.name}</span>
                </div>
                <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(wallet.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
