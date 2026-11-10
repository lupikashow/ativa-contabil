import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('rotinas')
export class Rotina {
  @PrimaryGeneratedColumn()
  idRotina: number;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  descricao: string;

  @Column()
  dataVencimento: string;

  @Column({ default: 'Pendente' })
  status: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.rotinas, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @ManyToOne(() => Usuario, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'colaboradorId' })
  colaborador: Usuario;
}