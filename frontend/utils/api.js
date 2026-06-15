import axios from 'axios';

const api = axios.create({
  // THIS IS THE MAGIC LINE. It must point to your Flask server's /api folder
  baseURL: 'http://localhost:5000/api', 
});

export default api;