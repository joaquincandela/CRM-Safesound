import { ApiAuthRepository } from "./api/ApiAuthRepository";

export const container = {
  auth: new ApiAuthRepository(),
} as const;
