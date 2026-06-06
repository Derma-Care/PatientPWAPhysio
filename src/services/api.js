import axios from 'axios';
// Dev
// const BASE_URL = 'http://3.111.28.174:9090';

// test
// export const BASE_URL = 'http://3.7.216.95:9090';
export const BASE_URL = 'https://api.ccmstestserver.online';
export const IMAGE_BASE_URL = "https://physiocare-prod-storage.s3.ap-south-1.amazonaws.com";
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
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

    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      window.dispatchEvent(new CustomEvent('api-server-down'));
    }

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
  getBookings: async (customerId, branchId) => {
    const response = await api.get(`/api/customer/bookings/customerId/${customerId}`); //TODO:remove branch Id here hardcoded here
    return response.data;
  },
  getCompletedBookings: async (customerId) => {
    const response = await api.get(`/api/customer/booking/completed/customerId/${customerId}`);
    return response.data;
  },
  getBookingById: async (bookingId) => {
    const response = await api.get(`/clinic-admin/getBookedServiceById/${bookingId}`);
    return response.data;
  },
  getProfile: async (customerId) => {
    const response = await api.get(`/clinic-admin/customers/id/${customerId}`);
    return response.data;
  },
  updateProfile: async (customerId, data) => {
    const response = await api.put(`/clinic-admin/customers/updatecustomer/${customerId}`, data);
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
  getVisitHistory: async ({ doctorId, patientId, bookingId, clinicId, branchId }) => {
    const response = await api.post('/api/customer/first-visit-history', { doctorId, patientId, bookingId, clinicId, branchId });
    return response.data;
  },
  getFullVisitHistory: async ({ doctorId, patientId, bookingId }) => {
    const response = await api.post('/api/customer/visit-history', { doctorId, patientId, bookingId });
    return response.data;
  },
  getActivitySessions: async ({ clinicId, branchId, patientId, bookingId, therapistId, therapistRecordId }) => {
    const response = await api.post('/api/customer/getExerciseSessionsWithRecords', { clinicId, branchId, patientId, bookingId, therapistId, therapistRecordId });
    return response.data;
  },
  saveHomeExercise: async (data) => {
    const response = await api.post('/api/customer/therapy-records/create', data);
    return response.data;
  },
  getCompletedTherapyRecord: async (clinicId, branchId, therapistRecordId, sessionId) => {
    const response = await api.get(`/api/physiotherapy-doctor/getCompletedTherapyRecord/${clinicId}/${branchId}/${therapistRecordId}/${sessionId}`);
    return response.data;
  },
};

export const paymentService = {
  getPayment: async (bookingId) => {
    const response = await api.get(`/api/physiotherapy-doctor/payment/${bookingId}`);
    return response.data;
  },
};

export const localPhysiotherapyService = {
  getByClinicBranchExercise: async (clinicId, branchId, therapistRecordId, patientId, exerciseId) => {
    console.log(`[localPhysiotherapyService] Fetching record for: clinic=${clinicId}, branch=${branchId}, therapistRecord=${therapistRecordId}, patient=${patientId}, exercise=${exerciseId}`);
    const response = await api.get(`/api/customer/therapy-records/getByClinicBranchExercise/${clinicId}/${branchId}/${therapistRecordId}/${patientId}/${exerciseId}`);
    return response.data;
  },
  createTherapyRecord: async (data) => {
    console.log('[localPhysiotherapyService] Creating therapy record');
    const response = await api.post(`/api/customer/therapy-records/create`, data);
    return response.data;
  },
  updateTherapyRecord: async (therapistRecordId, exerciseId, data) => {
    console.log(`[localPhysiotherapyService] Updating therapy record with ID: ${therapistRecordId}, exerciseId: ${exerciseId}`);
    const response = await api.put(`/api/customer/therapy-records/update/${therapistRecordId}/${exerciseId}`, data);
    return response.data;
  }
};

export default api;
