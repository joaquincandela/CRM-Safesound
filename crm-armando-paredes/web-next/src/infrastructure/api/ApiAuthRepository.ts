import type { IAuthRepository, UsuarioSession } from "@/domain/repositories/IAuthRepository";
import { apiClient } from "./ApiClient";

// Login real contra el backend Express (POST /api/auth/login).
// La respuesta del backend ({ token, usuario: { sub, email, nombre, rol } }) mapea
// 1:1 con el contrato del dominio, así que no necesita transformación.
export class ApiAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<{ token: string; usuario: UsuarioSession }> {
    return apiClient.post<{ token: string; usuario: UsuarioSession }>("/auth/login", {
      email,
      password,
    });
  }
}
