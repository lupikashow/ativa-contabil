import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

export enum StatusRotina {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
}

@Entity('rotinas')
export class Rotina {
  @PrimaryGeneratedColumn()
  idRotina: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ type: 'date' })
  dataVencimento: string;

  @Column({
    type: 'enum',
    enum: StatusRotina,
    default: StatusRotina.PENDENTE,
  })
  status: StatusRotina;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idEmpresa' })
  empresa: Empresa;

  @CreateDateColumn()
  criadoEm: Date;
}