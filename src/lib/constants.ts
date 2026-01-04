/**
 * Application-wide constants
 */

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Event categories
export const EVENT_CATEGORIES = [
  "All",
  "Workshop",
  "Seminar",
  "Hackathon",
  "Meetup",
  "Competition",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// Event statuses
export const EVENT_STATUSES = [
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

// Team types
export const TEAM_TYPES = [
  { value: "solo", label: "Individual" },
  { value: "duo", label: "Duo (2 members)" },
  { value: "squad", label: "Squad (3-5 members)" },
  { value: "any", label: "Team (Flexible)" },
] as const;

export type TeamType = (typeof TEAM_TYPES)[number]["value"];

// Resource types
export const RESOURCE_TYPES = [
  { value: "study_material", label: "Study Material" },
  { value: "past_paper", label: "Past Paper" },
  { value: "project", label: "Project" },
  { value: "interview_prep", label: "Interview Prep" },
  { value: "article", label: "Article" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

// User roles
export const USER_ROLES = ["admin", "moderator", "member"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// Payment statuses
export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["value"];

// Date filters for events
export const DATE_FILTERS = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
] as const;

// Forum categories
export const FORUM_CATEGORIES = [
  "general",
  "technical",
  "career",
  "events",
  "resources",
] as const;

export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

// Semesters
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9+\-\s()]+$/,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AI_CHAT: "ai-chat",
  SEND_REMINDER: "send-event-reminder",
  CREATE_USER: "create-user",
  SETUP_ADMIN: "setup-admin",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: "theme",
  SIDEBAR_STATE: "sidebar-state",
} as const;

// Animation durations (in seconds)
export const ANIMATION = {
  FAST: 0.15,
  NORMAL: 0.3,
  SLOW: 0.5,
} as const;
