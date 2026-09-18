import { RealtimeEvent } from './events';

export type RealtimeTargetType = 'user' | 'room';

export interface RealtimeStreamMessage {
  targetType: RealtimeTargetType;
  targetId: string;
  event: RealtimeEvent;
  payload: string;
  timestamp: string;
}
