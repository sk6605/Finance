'use client';

import { useState, useEffect } from 'react';

export default function ExchangeRateModal({ onClose }: { onClose: () => void }) {
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetching real-time exchange rates from open.er-api.com (Free, no key required)
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                if (data && data.rates) {
                    setRates(data.rates);
                } else {
                    throw new Error('Invalid data format');
                }
            })
            .catch(e => {
                console.error('Failed to fetch rates:', e);
                setError('Failed to load real-time exchange rates.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredRates = Object.entries(rates).filter(([currency]) =>
        currency.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card" style={{ width: '420px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-input)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-primary)'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>Global Exchange Rates</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Base Currency: <strong style={{ color: 'var(--color-text-primary)' }}>1 USD</strong>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search currency (e.g. CNY, MYR, EUR)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                            Fetching real-time rates...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-red)' }}>
                            {error}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1 }}>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600 }}>Currency</th>
                                    <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>Rate vs USD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRates.map(([currency, rate]) => (
                                    <tr key={currency} style={{ borderBottom: '1px solid var(--color-bg-input)', fontSize: '14px' }}>
                                        <td style={{ padding: '12px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', width: '24px' }}>
                                                {/* Optional: Add basic flag support or just standard text */}
                                            </span>
                                            {currency}
                                        </td>
                                        <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-gold-light)', fontWeight: 500 }}>
                                            {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </td>
                                    </tr>
                                ))}
                                {filteredRates.length === 0 && (
                                    <tr>
                                        <td colSpan={2} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
                                            No currency found matching "{search}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
