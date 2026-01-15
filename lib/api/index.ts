/**
 * API Client - Barrel exports
 */

// Base client
export { apiClient, apiGet, apiPost, type ApiError, type ApiResponse } from "./client";

// Parent APIs
export * from "./parent/auth";

// Child APIs
export * from "./child/auth";
export * from "./child/tasks";
export * from "./child/points";
