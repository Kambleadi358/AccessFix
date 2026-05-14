import axios from 'axios';
import { ScanRequest, ScanResult, PaginatedResponse } from '@accessfix/shared';

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000, // 2 minutes for Puppeteer scans
  headers: { 'Content-Type': 'application/json' },
});

// ─── Scan APIs ────────────────────────────────────────────────

export const startScan = async (request: ScanRequest): Promise<ScanResult> => {
  const res = await api.post('/scans', request);
  return res.data.data;
};

export const getScan = async (scanId: string): Promise<ScanResult> => {
  const res = await api.get(`/scans/${scanId}`);
  return res.data.data;
};

export const listScans = async (
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<ScanResult>> => {
  const res = await api.get(`/scans?page=${page}&pageSize=${pageSize}`);
  return res.data.data;
};

export const deleteScan = async (scanId: string): Promise<void> => {
  await api.delete(`/scans/${scanId}`);
};

// ─── Stats APIs ───────────────────────────────────────────────

export const getStats = async () => {
  const res = await api.get('/stats');
  return res.data.data;
};

export const getRules = async () => {
  const res = await api.get('/stats/rules');
  return res.data.data;
};

// ─── Report download helpers ──────────────────────────────────

export const downloadReport = (scanId: string, format: 'json' | 'csv' | 'html') => {
  window.open(`/api/reports/${scanId}/${format}`, '_blank');
};

export default api;
