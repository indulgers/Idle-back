import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface ChatEvent {
  type: 'message' | 'notification';
  roomId?: string;
  userId?: string;
  data: any;
}

@Injectable()
export class ChatEvents {
  private eventBus = new Subject<ChatEvent>();

  emit(event: ChatEvent) {
    this.eventBus.next(event);
  }

  subscribe(callback: (event: ChatEvent) => void) {
    return this.eventBus.subscribe(callback);
  }
}
