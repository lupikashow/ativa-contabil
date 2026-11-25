import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type PerfilUsuario = 'GESTOR' | 'COLABORADOR';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  nome: string;

  @Column({ type: 'varchar', length: 120, unique: true, nullable: false })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 255, nullable: false, select: true })
  senhaHash: string;

  @Column({ type: 'varchar', length: 30, nullable: false })
  departamento: string;

  @Column({ name: 'perfil_acesso', type: 'varchar', length: 20, nullable: false })
  perfilAcesso: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}