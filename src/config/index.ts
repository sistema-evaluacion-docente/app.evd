const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'http://localhost:3000'
const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development'

const IS_DEVELOPMENT = NODE_ENV === 'development'

/**
 * Largest file accepted by any upload, in bytes. Mirrors the backend's
 * `MAX_UPLOAD_SIZE_MB` (20): checking it here only spares the round trip.
 */
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

export { API_URL, IS_DEVELOPMENT, MAX_UPLOAD_SIZE, PUBLIC_URL }
