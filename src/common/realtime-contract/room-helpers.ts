// =====================================================
// Task Room
// =====================================================

export function taskRoom(taskId: string): string {
  return `room_task_${taskId}`;
}

// =====================================================
// Task Group Room
// =====================================================

export function taskGroupRoom(groupId: string): string {
  return `room_task_group_${groupId}`;
}

// =====================================================
// User Room
// =====================================================

export function userRoom(userId: string): string {
  return `room_user_${userId}`;
}