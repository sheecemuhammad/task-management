export const REALTIME_EVENTS = {
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
} as const;

export type RealtimeEvent =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];