import type { ID, ISODateString } from "../types/commonType.js";
import type { NotificationStatus } from "../enums/notificationStatusEnum.js";
import type {
  NotificationChannel,
  NotificationResourceType
} from "../types/notification.type.js";

export interface INotification {
  id: ID;

  channel: NotificationChannel;
  recipient: string;
  subject: string;

  resourceType: NotificationResourceType;
  resourceId: ID | null;

  status: NotificationStatus;

  sentAt: ISODateString | null;
  deliveredAt: ISODateString | null;
  failureReason: string | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}