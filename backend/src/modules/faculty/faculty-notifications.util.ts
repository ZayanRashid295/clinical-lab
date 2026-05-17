import { NotificationType } from "@prisma/client";

export function assignmentPublishedNotification(input: {
  assignmentId: string;
  title: string;
  dueAt?: Date | null;
}) {
  const dueSuffix = input.dueAt
    ? ` Due ${input.dueAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}.`
    : "";
  return {
    type: NotificationType.ASSIGNMENT_PUBLISHED,
    title: "New faculty assignment",
    message: `${input.title} has been assigned to you.${dueSuffix}`,
    data: {
      assignmentId: input.assignmentId,
      route: "/assignments",
    },
  };
}

export function facultyMessageNotification(input: {
  facultyUserId: string;
  facultyFirstName?: string | null;
  facultyLastName?: string | null;
  preview: string;
  threadId?: string;
}) {
  const name = [input.facultyFirstName, input.facultyLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    type: NotificationType.FACULTY_MESSAGE,
    title: name ? `Message from Dr. ${name}` : "Message from faculty",
    message: input.preview.slice(0, 120),
    data: {
      threadId: input.threadId,
      facultyUserId: input.facultyUserId,
      route: "/messages",
    },
  };
}

export function assignmentDueNotification(input: {
  assignmentId: string;
  title: string;
  dueAt: Date;
}) {
  return {
    type: NotificationType.ASSIGNMENT_DUE,
    title: "Assignment due soon",
    message: `"${input.title}" is due ${input.dueAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}.`,
    data: {
      assignmentId: input.assignmentId,
      route: "/assignments",
    },
  };
}

export function institutionLinkedNotification(input: {
  institutionId: string;
  institutionName: string;
}) {
  return {
    type: NotificationType.WELCOME,
    title: `Connected to ${input.institutionName}`,
    message:
      "Your institution account is active. View assignments and message your faculty from the dashboard.",
    data: {
      institutionId: input.institutionId,
      route: "/assignments",
    },
  };
}
