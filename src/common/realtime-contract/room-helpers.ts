export function taskRoom(taskId: string): string {
  return `room_task_${taskId}`;
}

export function userRoom(userId: string): string {
  return `room_user_${userId}`;
}