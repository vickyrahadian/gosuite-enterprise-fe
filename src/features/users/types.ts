export type UserGroup = {
  id: number;
  groupName: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  groups: UserGroup[];
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  groupIds: number[];
};

export type UpdateUserPayload = Omit<CreateUserPayload, 'password'> & {
  password: string | null;
};
