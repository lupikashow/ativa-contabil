import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  idEmpresa: number;

  @Column({ nullable: true })
  nome: string;

  @Column({ unique: true })
  cnpj: string;

  @Column({ nullable: true })
  regime: string;

  @Column({ nullable: true })
  responsavel: string;
}