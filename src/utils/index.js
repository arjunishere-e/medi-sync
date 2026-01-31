// Utility functions for MediSync
export function createPageUrl(page, params = {}) {
  const baseUrl = `/${page}`;
  const queryParams = new URLSearchParams(params).toString();
  return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

export function formatTime(time) {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}