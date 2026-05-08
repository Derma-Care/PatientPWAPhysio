import axios from 'axios';

const BASE_URL = 'http://3.111.28.174:9090';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding tokens if needed
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/clinic-admin/customers/login', credentials);
    return response.data;
  },
};

export const customerService = {
  getBookings: async (customerId) => {
    const response = await api.get(`/api/customer/bookings/customerId/${customerId}`);
    return response.data;
  },
  getProfile: async (customerId) => {
    const response = await api.get(`/clinic-admin/customers/id/${customerId}`);
    return response.data;
  },
  getReports: async (customerId) => {
    const response = await api.get(`/api/customer/getReports/${customerId}`);
    return response.data;
  },
};

export const clinicService = {
  getClinic: async (clinicId) => {
    const response = await api.get(`/clinic-admin/getClinic/${clinicId}`);
    return response.data;
  },
  getDoctor: async (doctorId) => {
    const response = await api.get(`/clinic-admin/doctor/${doctorId}`);
    return response.data;
  },
};

export const physiotherapyService = {
  getVisitHistory: async (patientId, bookingId) => {
    const response = await api.get(`/api/physiotherapy-doctor/visitHistoryByUsingPatientIdAndBooking/${patientId}/${bookingId}`);
    return response.data;
  },
  getActivitySessions: async (clinicId, branchId, bookingId, patientId, therapistRecordId) => {
    const response = await api.get(`/api/physiotherapy-doctor/payment/getExerciseSessionsWithRecords/${clinicId}/${branchId}/${bookingId}/${patientId}/${therapistRecordId}`);
    return response.data;
  },
  saveHomeExercise: async (data) => {
    const response = await api.post('/api/physiotherapy-doctor/saveHomeExercise', data);
    return response.data;
  },
};

export default api;
