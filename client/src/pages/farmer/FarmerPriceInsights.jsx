import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Search, Info } from 'lucide-react';
import { priceInsightService } from '../../services/miscServices';

const CATEGORIES = ['vegetables', 'fruits', 'grains', 'pulses', 'dairy', 'spices', 'herbs', 'flowers', 'other'];

export default function FarmerPriceInsights() {
  const [category, setCategory] = useState('vegetables');
  const [productName, setProductName] = useState('');
  const [comparison, setComparison] = useState(null);
  const [trend, setTrend] = useState(null);
  const [external, setExternal] = useState(null);
  const [loading, setLoading] = useState(false);

  const [estimateQty, setEstimateQty] = useState('');
  const [estimatePrice, setEstimatePrice] = useState('');
  const [estimateResult, setEstimateResult] = useState(null);

  const search = async () => {
    setLoading(true);
    try {
      const [c, t, e] = await Promise.all([
        priceInsightService.compare({ category, productName }),
        priceInsightService.trend({ category, productName, months: 6 }),
        priceInsightService.external({ category, productName }),
      ]);
      setComparison(c.data);
      setTrend(t.data);
      setExternal(e.data);
    } finally {
      setLoading(false);
    }
  };

  const estimate = async () => {
    const res = await priceInsightService.estimateRevenue({ quantity: estimateQty, pricePerUnit: estimatePrice });
    setEstimateResult(res.data);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-forest-900 flex items-center gap-2">
        <TrendingUp className="text-leaf-600" /> Price Insights
      </h1>

      <div className="card p-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Product name (optional)</label>
          <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Tomato" />
        </div>
        <button className="btn-primary" onClick={search} disabled={loading}><Search size={16} /> {loading ? 'Searching…' : 'Search'}</button>
      </div>

      {comparison && (
        <div className="card p-5">
          <p className="font-medium mb-1">Comparable listings on the platform</p>
          <p className="text-xs text-forest-400 mb-3 flex items-center gap-1"><Info size={12} /> Source: real active platform listings, not estimated.</p>
          {comparison.summary.sampleSize === 0 ? <p className="text-sm text-forest-400">No comparable listings found.</p> : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div className="card p-3"><p className="text-forest-400 text-xs">Lowest</p><p className="font-semibold">₹{comparison.summary.min}</p></div>
                <div className="card p-3"><p className="text-forest-400 text-xs">Average</p><p className="font-semibold">₹{comparison.summary.average}</p></div>
                <div className="card p-3"><p className="text-forest-400 text-xs">Highest</p><p className="font-semibold">₹{comparison.summary.max}</p></div>
              </div>
              <div className="max-h-52 overflow-auto space-y-1">
                {comparison.comparableListings.map((l) => (
                  <div key={l._id} className="flex justify-between text-sm py-1 border-b border-forest-50">
                    <span>{l.name} — {l.farmer?.name}</span><span className="font-medium">₹{l.price}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {trend && (
        <div className="card p-5">
          <p className="font-medium mb-1">Historical price trend</p>
          <p className="text-xs text-forest-400 mb-3 flex items-center gap-1"><Info size={12} /> {trend.note}</p>
          {trend.trend.length === 0 ? <p className="text-sm text-forest-400">No trend data available yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0ebe2" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="averagePrice" stroke="#336142" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {external && (
        <div className="card p-5">
          <p className="font-medium mb-1">External regional reference prices</p>
          <p className="text-xs text-forest-400 mb-3 flex items-center gap-1"><Info size={12} /> {external.note}</p>
          {external.references.length > 0 && (
            <div className="space-y-1">
              {external.references.map((r) => (
                <div key={r._id} className="flex justify-between text-sm py-1 border-b border-forest-50">
                  <span>{r.productName} ({r.state || 'National'})</span>
                  <span>₹{r.referencePrice}/{r.unit} — {r.source}, {new Date(r.sourceDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card p-5">
        <p className="font-medium mb-3">Estimate gross revenue</p>
        <div className="flex flex-wrap gap-3 items-end">
          <input type="number" min="0" placeholder="Quantity" className="input w-32" value={estimateQty} onChange={(e) => setEstimateQty(e.target.value)} />
          <input type="number" min="0" placeholder="Price per unit" className="input w-40" value={estimatePrice} onChange={(e) => setEstimatePrice(e.target.value)} />
          <button className="btn-secondary" onClick={estimate}>Estimate</button>
        </div>
        {estimateResult && (
          <p className="text-sm mt-3">
            Estimated gross revenue: <strong>₹{estimateResult.estimatedGrossRevenue}</strong>
            <span className="text-xs text-forest-400 block mt-1">{estimateResult.note}</span>
          </p>
        )}
      </div>
    </div>
  );
}
