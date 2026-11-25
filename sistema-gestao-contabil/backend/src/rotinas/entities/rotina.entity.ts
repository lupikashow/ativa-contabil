import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tarefa_competencia')
export class Rotina {
  @PrimaryGeneratedColumn({ name: 'id_tarefa' })
  idRotina: number;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'titulo' })
  titulo: string;

  @Column({ type: 'text', nullable: true, name: 'descricao' })
  descricao: string;

  @Column({ name: 'id_empresa', type: 'integer', nullable: true })
  idEmpresa: number;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id_empresa' })
  empresa: Empresa;

  @Column({ name: 'id_rotina', type: 'integer', nullable: true })
  idRotinaRef: number;

  @Column({ name: 'id_responsavel', type: 'integer', nullable: true })
  idResponsavel: number;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_responsavel' })
  responsavel: Usuario;

  @Column({ type: 'varchar', length: 7, nullable: true })
  competencia: string;

  @Column({ type: 'date', name: 'data_vencimento_calculada', nullable: true })
  dataVencimentoCalculada: string;

  @Column({ type: 'varchar', length: 30, default: 'Pendente' })
  status: string;

  @Column({ type: 'timestamp', name: 'data_conclusao', nullable: true })
  dataConclusao: Date;

  @Column({ type: 'timestamp', name: 'criado_em', nullable: true })
  criadoEm: Date;
}