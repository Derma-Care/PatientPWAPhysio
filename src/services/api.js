import axios from 'axios';
// Dev
// const BASE_URL = 'http://3.111.28.174:9090';

// test
const BASE_URL = 'http://3.7.165.97:9090';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for adding tokens if needed
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('[Request Headers]', config.headers);
    console.log('[Request Data]', config.data);

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      console.log('[Auth Token Added]', `Bearer ${user.token.substring(0, 20)}...`);
    }
    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} - ${response.statusText}`);
    console.log('[Response Data]', response.data);
    return response;
  },
  (error) => {
    console.error('[API Error]', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      }
    });
    return Promise.reject(error);
  }
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
    const response = await api.post('/api/customer/therapy-records/create', data);
    return response.data;
  },
};

export const localPhysiotherapyService = {
  getByClinicBranchExercise: async (clinicId, branchId, exerciseId) => {
    console.log(`[localPhysiotherapyService] Fetching record for: clinic=${clinicId}, branch=${branchId}, exercise=${exerciseId}`);
    const response = await api.get(`/api/customer/therapy-records/getByClinicBranchExercise/${clinicId}/${branchId}/${exerciseId}`);
    return response.data;
  },
  createTherapyRecord: async (data) => {
    console.log('[localPhysiotherapyService] Creating therapy record');
    const response = await api.post(`/api/customer/therapy-records/create`, data);
    return response.data;
  },
  updateTherapyRecord: async (id, data) => {
    console.log(`[localPhysiotherapyService] Updating therapy record with ID: ${id}`);
    const response = await api.put(`/api/customer/therapy-records/update/${id}`, data);
    return response.data;
  }
};

export default api;
