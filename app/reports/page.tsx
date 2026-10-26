'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';
import {
  InventorySummaryReport,
  ItemSummaryReport,
  Category,
  Supplier,
} from '@/lib/types';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  RefreshCw,
  Download,
  Printer,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  PieChart,
  Boxes,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

const fmt = (n: number) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

export default function ReportsPage() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'item-summary' | 'inventory-summary' | 'sales-overview'>('item-summary');

  // Date Range state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom'>('month');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  // Data states
  const [itemSummary, setItemSummary] = useState<ItemSummaryReport | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryReport | null>(null);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Expandable department rows in inventory summary
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  // Quick Preset handler
  const handlePresetChange = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all') => {
    setDatePreset(preset);
    const today = new Date();
    let from = new Date();
    let to = new Date();

    if (preset === 'today') {
      from = today;
      to = today;
    } else if (preset === 'yesterday') {
      from.setDate(today.getDate() - 1);
      to.setDate(today.getDate() - 1);
    } else if (preset === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      from = new Date(today.setDate(diff));
      to = new Date();
    } else if (preset === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date();
    } else if (preset === 'year') {
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date();
    } else if (preset === 'all') {
      from = new Date(2020, 0, 1);
      to = new Date();
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const loadData = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    setError(null);

    try {
      const [itemSumRes, invSumRes, salesRes, cats, sups] = await Promise.all([
        api.getItemSummary({ dateFrom, dateTo }),
        api.getInventorySummary(),
        api.getSalesReport(dateFrom, dateTo).catch(() => null),
        api.getCategories().catch(() => []),
        api.getSuppliers().catch(() => []),
      ]);

      setItemSummary(itemSumRes);
      setInventorySummary(invSumRes);
      setSalesReport(salesRes);
      setCategories(cats);
      setSuppliers(sups);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.message || 'Failed to load report data. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!getStoredToken()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [loadData, router]);

  // Toggle department expand
  const toggleDept = (deptName: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptName]: !prev[deptName],
    }));
  };

  // Filtered Item Summary rows
  const filteredItemRows = useMemo(() => {
    if (!itemSummary?.items) return [];
    return itemSummary.items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = !selectedDept || item.department === selectedDept;
      const matchesVendor = !selectedVendor || item.vendor === selectedVendor;

      return matchesSearch && matchesDept && matchesVendor;
    });
  }, [itemSummary, searchQuery, selectedDept, selectedVendor]);

  // Totals for filtered Item Summary rows
  const filteredItemTotals = useMemo(() => {
    const totalQtySold = filteredItemRows.reduce((acc, i) => acc + i.qtySold, 0);
    const totalExtPrice = filteredItemRows.reduce((acc, i) => acc + i.extPrice, 0);
    const totalExtCost = filteredItemRows.reduce((acc, i) => acc + i.extCost, 0);
    const totalMargin = totalExtPrice - totalExtCost;
    const overallMarginPercent =
      totalExtPrice > 0 ? Number(((totalMargin / totalExtPrice) * 100).toFixed(2)) : 0;

    return {
      totalQtySold,
      totalExtPrice,
      totalExtCost,
      totalMargin,
      overallMarginPercent,
    };
  }, [filteredItemRows]);

  // Filtered Inventory Summary Departments
  const filteredInventoryDepts = useMemo(() => {
    if (!inventorySummary?.departments) return [];
    return inventorySummary.departments
      .map((dept) => {
        const products = dept.products.filter((p) => {
          const matchesSearch =
            !searchQuery ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesVendor = !selectedVendor || p.vendor === selectedVendor;
          return matchesSearch && matchesVendor;
        });

        const onHandQty = products.reduce((acc, p) => acc + p.onHandQty, 0);
        const extCost = products.reduce((acc, p) => acc + p.extCost, 0);
        const extPrice = products.reduce((acc, p) => acc + p.extPrice, 0);
        const onOrder = products.reduce((acc, p) => acc + p.onOrder, 0);
        const margin = extPrice - extCost;
        const marginPercent = extPrice > 0 ? Number(((margin / extPrice) * 100).toFixed(2)) : 0;

        return {
          ...dept,
          onHandQty,
          extCost,
          extPrice,
          onOrder,
          margin,
          marginPercent,
          products,
        };
      })
      .filter((dept) => {
        const matchesDept = !selectedDept || dept.department === selectedDept;
        return matchesDept && dept.products.length > 0;
      });
  }, [inventorySummary, searchQuery, selectedDept, selectedVendor]);

  // Filtered Inventory Summary Totals
  const filteredInventoryTotals = useMemo(() => {
    const totalOnHandQty = filteredInventoryDepts.reduce((acc, d) => acc + d.onHandQty, 0);
    const totalExtCost = filteredInventoryDepts.reduce((acc, d) => acc + d.extCost, 0);
    const totalExtPrice = filteredInventoryDepts.reduce((acc, d) => acc + d.extPrice, 0);
    const totalOnOrder = filteredInventoryDepts.reduce((acc, d) => acc + d.onOrder, 0);
    const totalMargin = totalExtPrice - totalExtCost;
    const overallMarginPercent =
      totalExtPrice > 0 ? Number(((totalMargin / totalExtPrice) * 100).toFixed(2)) : 0;

    return {
      totalOnHandQty,
      totalExtCost,
      totalExtPrice,
      totalOnOrder,
      totalMargin,
      overallMarginPercent,
    };
  }, [filteredInventoryDepts]);

  // CSV Exporter
  const exportCsv = () => {
    let csv = '';
    if (activeTab === 'item-summary') {
      csv = 'Department,Vendor,Product Name,SKU,Qty Sold,Ext Price (₦),Ext Cost (₦),Margin (₦),Margin (%)\n';
      filteredItemRows.forEach((row) => {
        csv += `"${row.department}","${row.vendor}","${row.productName}","${row.sku}",${row.qtySold},${row.extPrice},${row.extCost},${row.margin},${row.marginPercent}%\n`;
      });
      csv += `\n"TOTALS","","","",${filteredItemTotals.totalQtySold},${filteredItemTotals.totalExtPrice},${filteredItemTotals.totalExtCost},${filteredItemTotals.totalMargin},${filteredItemTotals.overallMarginPercent}%\n`;
    } else if (activeTab === 'inventory-summary') {
      csv = 'Department,Item Name,SKU,On-Hand Qty,Unit Cost (₦),Unit Price (₦),Ext Cost (₦),Ext Price (₦),On Order\n';
      filteredInventoryDepts.forEach((dept) => {
        csv += `"${dept.department} (SUMMARY)","","",${dept.onHandQty},"","",${dept.extCost},${dept.extPrice},${dept.onOrder}\n`;
        dept.products.forEach((p) => {
          csv += `"${p.department}","${p.name}","${p.sku}",${p.onHandQty},${p.costPrice},${p.sellingPrice},${p.extCost},${p.extPrice},${p.onOrder}\n`;
        });
      });
      csv += `\n"GRAND TOTALS","","",${filteredInventoryTotals.totalOnHandQty},"","",${filteredInventoryTotals.totalExtCost},${filteredInventoryTotals.totalExtPrice},${filteredInventoryTotals.totalOnOrder}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pmLabels: Record<string, string> = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    POS_CARD: 'POS/Card',
    SPLIT: 'Split Payment',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Reports & Business Analytics
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                QuickBooks-Style Inventory Summary & Date-Range Item Sales Ledger
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportCsv}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all active:scale-95"
            title="Print Report"
          >
            <Printer className="w-4 h-4 text-slate-600" /> Print
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Chunky Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto thin-scroll">
        <button
          onClick={() => setActiveTab('item-summary')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'item-summary'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Item Summary (Date Range)
        </button>

        <button
          onClick={() => setActiveTab('inventory-summary')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'inventory-summary'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-400" /> Inventory Summary
        </button>

        <button
          onClick={() => setActiveTab('sales-overview')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'sales-overview'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-4 h-4 text-rose-400" /> Sales Overview & KPIs
        </button>
      </div>

      {/* Date Range Bar (For Item Summary & Sales Overview) */}
      {(activeTab === 'item-summary' || activeTab === 'sales-overview') && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                Quick Presets:
              </span>
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'year', label: 'This Year' },
                { id: 'all', label: 'All Time' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    datePreset === p.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent border-0 focus:outline-none text-slate-700 font-semibold"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="bg-transparent border-0 focus:outline-none text-slate-700 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search department, vendor, product name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium shadow-sm"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Departments</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Vendors</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Report Data...
          </p>
        </div>
      )}

      {/* TAB 1: ITEM SUMMARY (DATE RANGE) */}
      {!loading && activeTab === 'item-summary' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Qty Sold</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{filteredItemTotals.totalQtySold}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{filteredItemRows.length} distinct items</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales (Ext Price)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{fmt(filteredItemTotals.totalExtPrice)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{dateFrom} to {dateTo}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total COGS (Ext Cost)</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{fmt(filteredItemTotals.totalExtCost)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cost of sold units</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Total Margin</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{fmt(filteredItemTotals.totalMargin)}</p>
              <p className="text-[11px] font-bold text-blue-600 mt-0.5">
                {filteredItemTotals.overallMarginPercent}% Margin
              </p>
            </div>
          </div>

          {/* QuickBooks Item Summary Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Item Summary by Date Range
                </h2>
                <p className="text-xs text-slate-500">
                  Columns: Department, Vendor, Product Name, Qty Sold, Ext Price, Ext Cost, Margin
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {filteredItemRows.length} items
              </span>
            </div>

            <div className="overflow-x-auto thin-scroll">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-5 py-3.5">Departments</th>
                    <th className="px-5 py-3.5">Vendor</th>
                    <th className="px-5 py-3.5">Product Name</th>
                    <th className="px-5 py-3.5 text-right">Qty Sold</th>
                    <th className="px-5 py-3.5 text-right">Ext Price (₦)</th>
                    <th className="px-5 py-3.5 text-right">Ext Cost (₦)</th>
                    <th className="px-5 py-3.5 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItemRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                        No sales found for the selected date range and filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItemRows.map((row) => (
                      <tr key={row.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                            {row.department}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                          {row.vendor}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{row.productName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{row.sku}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-900">
                          {row.qtySold}
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-emerald-700">
                          {fmt(row.extPrice)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                          {fmt(row.extCost)}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="font-extrabold text-xs text-blue-700">
                            {fmt(row.margin)}
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                            {row.marginPercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Summary Totals Row */}
                {filteredItemRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900 text-xs">
                      <td className="px-5 py-4 uppercase tracking-wider" colSpan={3}>
                        TOTALS ({filteredItemRows.length} Items)
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-emerald-300">
                        {filteredItemTotals.totalQtySold}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-emerald-400">
                        {fmt(filteredItemTotals.totalExtPrice)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-sm text-slate-200">
                        {fmt(filteredItemTotals.totalExtCost)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-blue-300">
                        <div className="font-black">{fmt(filteredItemTotals.totalMargin)}</div>
                        <div className="text-[10px] text-blue-200 font-bold">
                          {filteredItemTotals.overallMarginPercent}% Margin
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY SUMMARY */}
      {!loading && activeTab === 'inventory-summary' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total On-Hand Qty</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{filteredInventoryTotals.totalOnHandQty}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{filteredInventoryDepts.length} departments</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ext Cost (Inventory Valuation)</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{fmt(filteredInventoryTotals.totalExtCost)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Asset cost in stock</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ext Price (Retail Potential)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{fmt(filteredInventoryTotals.totalExtPrice)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Full retail value</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">On Order</p>
              <p className="text-2xl font-black text-amber-900 mt-1">{filteredInventoryTotals.totalOnOrder}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Pending stock receipts</p>
            </div>
          </div>

          {/* QuickBooks Inventory Summary Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Inventory Summary by Department
                </h2>
                <p className="text-xs text-slate-500">
                  Columns: Department, On-Hand Qty, Ext Cost, Ext Price, On Order
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Click a department to expand/collapse items
              </span>
            </div>

            <div className="overflow-x-auto thin-scroll">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5 text-right">On-Hand Qty</th>
                    <th className="px-5 py-3.5 text-right">Ext Cost (₦)</th>
                    <th className="px-5 py-3.5 text-right">Ext Price (₦)</th>
                    <th className="px-5 py-3.5 text-right">On Order</th>
                    <th className="px-5 py-3.5 text-right">Unrealized Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventoryDepts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    filteredInventoryDepts.map((dept) => {
                      const isExpanded = expandedDepts[dept.department] ?? true;
                      return (
                        <React.Fragment key={dept.department}>
                          {/* Department Group Header Row */}
                          <tr
                            onClick={() => toggleDept(dept.department)}
                            className="bg-slate-100/70 hover:bg-slate-100 cursor-pointer font-bold transition-colors border-t border-slate-200"
                          >
                            <td className="px-5 py-3.5 text-slate-900 flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              )}
                              <span className="text-sm font-black">{dept.department}</span>
                              <span className="text-[11px] font-normal text-slate-500">
                                ({dept.products.length} items)
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-slate-900">
                              {dept.onHandQty}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                              {fmt(dept.extCost)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-emerald-700">
                              {fmt(dept.extPrice)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-amber-700">
                              {dept.onOrder}
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs text-blue-700 font-bold">
                              {fmt(dept.margin)} ({dept.marginPercent}%)
                            </td>
                          </tr>

                          {/* Individual Products under this Department */}
                          {isExpanded &&
                            dept.products.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors text-xs">
                                <td className="pl-12 pr-5 py-2.5">
                                  <div className="font-semibold text-slate-800">{p.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    SKU: {p.sku} {p.vendor ? `• Vendor: ${p.vendor}` : ''}
                                  </div>
                                </td>
                                <td className="px-5 py-2.5 text-right font-bold text-slate-700">
                                  {p.onHandQty} {p.unitOfMeasurement}
                                </td>
                                <td className="px-5 py-2.5 text-right text-slate-600">
                                  {fmt(p.extCost)}
                                </td>
                                <td className="px-5 py-2.5 text-right text-emerald-600 font-semibold">
                                  {fmt(p.extPrice)}
                                </td>
                                <td className="px-5 py-2.5 text-right text-slate-500">
                                  {p.onOrder}
                                </td>
                                <td className="px-5 py-2.5 text-right text-slate-500">
                                  {fmt(p.extPrice - p.extCost)}
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* Summary Totals Row */}
                {filteredInventoryDepts.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900 text-xs">
                      <td className="px-5 py-4 uppercase tracking-wider">
                        TOTALS ({filteredInventoryDepts.length} Departments)
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-emerald-300">
                        {filteredInventoryTotals.totalOnHandQty}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-slate-200">
                        {fmt(filteredInventoryTotals.totalExtCost)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-emerald-400">
                        {fmt(filteredInventoryTotals.totalExtPrice)}
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm text-amber-300">
                        {filteredInventoryTotals.totalOnOrder}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-blue-300">
                        <div className="font-black">{fmt(filteredInventoryTotals.totalMargin)}</div>
                        <div className="text-[10px] text-blue-200 font-bold">
                          {filteredInventoryTotals.overallMarginPercent}% Margin
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALES OVERVIEW & KPIS */}
      {!loading && activeTab === 'sales-overview' && (
        <div className="space-y-6">
          {salesReport ? (
            <>
              {/* Sales Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {fmt(salesReport.totalRevenue ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {dateFrom} – {dateTo}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Transactions
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {salesReport.totalTransactions ?? 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Completed sales</p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Avg. Sale Value
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {fmt(salesReport.averageSaleValue ?? 0)}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Total Discounts
                  </p>
                  <p className="text-3xl font-black text-rose-600">
                    -{fmt(salesReport.totalDiscounts ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sales by Payment Method */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Sales by Payment Method
                  </h3>
                  {salesReport.byPaymentMethod && Object.keys(salesReport.byPaymentMethod).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(salesReport.byPaymentMethod).map(([method, data]: [string, any]) => (
                        <div key={method} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">{pmLabels[method] ?? method}</span>
                            <span className="text-slate-900">
                              {fmt(data.amount ?? 0)}{' '}
                              <span className="text-slate-400 font-normal">({data.count} sales)</span>
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                              style={{
                                width: `${Math.min(
                                  ((data.amount ?? 0) / (salesReport.totalRevenue || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No payment data for selected period.</p>
                  )}
                </div>

                {/* Top Selling Products */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rose-500" /> Top Selling Products
                  </h3>
                  {salesReport.topProducts?.length > 0 ? (
                    <div className="space-y-2.5">
                      {salesReport.topProducts.slice(0, 8).map((p: any, i: number) => (
                        <div
                          key={p.productId ?? i}
                          className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                        >
                          <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 text-xs font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{p.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{fmt(p.revenue)}</p>
                            <p className="text-[11px] text-slate-400">{p.quantitySold} sold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No product sales data yet.</p>
                  )}
                </div>
              </div>

              {/* Daily Sales Breakdown */}
              {salesReport.dailySales?.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Daily Sales Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto thin-scroll">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                          <th className="px-6 py-3 text-left">Date</th>
                          <th className="px-6 py-3 text-right">Transactions</th>
                          <th className="px-6 py-3 text-right">Revenue (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesReport.dailySales.map((d: any) => (
                          <tr key={d.date} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3 font-semibold text-slate-800">
                              {new Date(d.date).toLocaleDateString('en-NG', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-600 font-bold">{d.count}</td>
                            <td className="px-6 py-3 text-right font-black text-slate-900">
                              {fmt(d.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              No sales recorded for this date range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
