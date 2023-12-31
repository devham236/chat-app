import axios from "axios"

// axios.defaults.baseURL = "https://chat-app-server-sigma.vercel.app/api/v1"
axios.defaults.baseURL = "http://localhost:3000/api/v1"

const token = JSON.parse(sessionStorage.getItem("token"))

if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

export default axios
