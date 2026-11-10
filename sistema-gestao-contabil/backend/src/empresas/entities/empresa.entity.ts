import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Rotina } from '../../rotinas/entities/rotina.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn()
  idEmpresa: number;

  @Column()
  nome: string;

  @Column()
  cnpj: string;

  @Column({ nullable: true })
  tipo: string;

  @Column({ nullable: true })
  responsavel: string;

  @OneToMany(() => Rotina, (rotina) => rotina.empresa)
  rotinas: Rotina[];
}