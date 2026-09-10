export interface CommentCreatedPayload {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface CommentUpdatedPayload {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface CommentDeletedPayload {
  id: string;
  taskId: string;
  deleted: boolean;
}