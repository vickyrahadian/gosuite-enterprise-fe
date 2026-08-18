export type AuthGroup = {
  id: number;
  groupName: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  groups: AuthGroup[];
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthSession = {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: AuthUser;
};

export type RefreshTokenResponse = Pick<AuthSession, 'tokenType' | 'accessToken' | 'accessTokenExpiresIn'>;
