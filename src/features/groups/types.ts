export type Group = {
  id: number;
  groupName: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupPayload = Pick<Group, 'groupName'>;
