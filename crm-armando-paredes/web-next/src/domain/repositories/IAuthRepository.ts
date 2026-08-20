export interface UsuarioSession {
  sub: string;
  email: string;
  nombre: string;
  rol: string;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<{ token: string; usuario: UsuarioSession }>;
}
