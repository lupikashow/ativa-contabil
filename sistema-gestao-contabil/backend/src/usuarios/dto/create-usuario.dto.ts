import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import type { PerfilUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  senha: string;

  @IsOptional()
  perfil?: PerfilUsuario;
}