export const REALTIME_EVENTS = {
  // =====================================================
  // Comment Events
  // =====================================================

  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  COMMENT_LIKED: 'comment:liked',
  COMMENT_UNLIKED: 'comment:unliked',

  // =====================================================
  // Task Events
  // =====================================================

  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_ASSIGNEES_UPDATED: 'task:assignees-updated',

  // =====================================================
  // Task Group Events
  // =====================================================

  TASK_GROUP_CREATED: 'task_group:created',
  TASK_GROUP_UPDATED: 'task_group:updated',
  TASK_GROUP_DELETED: 'task_group:deleted',

  // =====================================================
  // Attachment Events
  // =====================================================

  ATTACHMENT_CREATED: 'attachment:created',
  ATTACHMENT_DELETED: 'attachment:deleted',

  // =====================================================
  // Team Events
  // =====================================================

  // TEAM_CREATED: 'team:created',
  // TEAM_UPDATED: 'team:updated',
  // TEAM_DELETED: 'team:deleted',
} as const;

export type RealtimeEvent =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
