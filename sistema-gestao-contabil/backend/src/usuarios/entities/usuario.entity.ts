import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum PerfilUsuario {
  GESTOR = 'GESTOR',
  COLABORADOR = 'COLABORADOR',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  idUsuario: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string;

  @Column({ default: PerfilUsuario.COLABORADOR })
  perfil: string;
}