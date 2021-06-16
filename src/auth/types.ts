export interface RegisterFields extends Record<string, any> {
  name: string;
  email: string;
  password: string;
}

export interface LoginFields extends Record<string, any> {
  email: string;
  password: string;
}
