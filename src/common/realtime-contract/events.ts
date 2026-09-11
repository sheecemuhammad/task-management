export const REALTIME_EVENTS = {
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  COMMENT_LIKED: 'comment:liked',
  COMMENT_UNLIKED: 'comment:unliked',
} as const;

export type RealtimeEvent =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
