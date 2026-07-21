const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'http://localhost:3000'
const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development'

const IS_DEVELOPMENT = NODE_ENV === 'development'

export { API_URL, IS_DEVELOPMENT, PUBLIC_URL }
