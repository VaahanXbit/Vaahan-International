/*
================================================================================
File: frontend/src/services/paymentService.js
Responsibility: Frontend API client for the Payment Module. Reuses your
                EXISTING `api` axios instance (the same one imported in
                App.jsx: `import { api } from './services/api'`) so base
                URL and auth headers are already handled — no new HTTP
                client is introduced.
================================================================================
*/

import { api } from './api';

const BASE = '/payment';

export async function createOrder({ resourceType, resourceId, resourceName, amount, currency = 'INR', metadata = {} }) {
  const { data } = await api.post(`${BASE}/create-order`, {
    resourceType,
    resourceId,
    resourceName,
    amount,
    currency,
    metadata,
  });
  return data; // { success, order, paymentId }
}

export async function verifyPayment({ paymentId, providerOrderId, providerPaymentId, providerSignature }) {
  const { data } = await api.post(`${BASE}/verify`, {
    paymentId,
    providerOrderId,
    providerPaymentId,
    providerSignature,
  });
  return data; // { success, payment }
}

export async function getPaymentStatus(paymentId) {
  const { data } = await api.get(`${BASE}/status/${paymentId}`);
  return data; // { success, payment }
}

export async function getPaymentHistory({ page = 1, limit = 20, resourceType } = {}) {
  const { data } = await api.get(`${BASE}/history`, { params: { page, limit, resourceType } });
  return data; // { success, items, pagination }
}