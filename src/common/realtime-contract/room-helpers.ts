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
// Team Room
// =====================================================

export function teamRoom(teamId: string): string {
  return `room_team_${teamId}`;
}

// =====================================================
// User Room
// =====================================================

export function userRoom(userId: string): string {
  return `room_user_${userId}`;
}
