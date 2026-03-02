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
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="card w-[420px] max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-input)] flex items-center justify-center text-[var(--color-gold-primary)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <h3 className="m-0 font-bold text-base">Global Exchange Rates</h3>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none text-[var(--color-text-secondary)] cursor-pointer text-xl hover:text-white">×</button>
                </div>

                <div className="mb-3 text-[13px] text-[var(--color-text-secondary)]">
                    Base Currency: <strong className="text-[var(--color-text-primary)]">1 USD</strong>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search currency (e.g. CNY, MYR, EUR)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="text-center py-10 px-5 text-[var(--color-text-secondary)]">
                            Fetching real-time rates...
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 px-5 text-[var(--color-red)]">
                            {error}
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-[var(--color-bg-card)] z-10">
                                <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)] text-[13px]">
                                    <th className="text-left py-2 px-0 font-semibold">Currency</th>
                                    <th className="text-right py-2 px-0 font-semibold">Rate vs USD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRates.map(([currency, rate]) => (
                                    <tr key={currency} className="border-b border-[var(--color-bg-input)] text-sm">
                                        <td className="py-3 px-0 font-semibold flex items-center gap-2">
                                            <span className="text-[var(--color-text-secondary)] text-xs w-6">
                                                {/* Optional: Add basic flag support or just standard text */}
                                            </span>
                                            {currency}
                                        </td>
                                        <td className="py-3 px-0 text-right font-mono text-[var(--color-gold-light)] font-medium">
                                            {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                        </td>
                                    </tr>
                                ))}
                                {filteredRates.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-center py-10 px-5 text-[var(--color-text-secondary)]">
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
