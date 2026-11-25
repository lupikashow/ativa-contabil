import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('empresa')
export class Empresa {
  @PrimaryGeneratedColumn({ name: 'id_empresa' })
  idEmpresa: number;

  @Column({ name: 'razao_social', type: 'varchar', length: 150, nullable: false })
  razaoSocial: string;

  @Column({ name: 'nome_fantasia', type: 'varchar', length: 100, nullable: true })
  nomeFantasia: string;

  @Column({ type: 'varchar', length: 18, unique: true, nullable: false })
  cnpj: string;

  @Column({ name: 'inscricao_estadual', type: 'varchar', length: 20, nullable: true })
  inscricaoEstadual: string;

  @Column({ name: 'regime_tributario', type: 'varchar', length: 30, nullable: false })
  regimeTributario: string;

  @Column({ name: 'data_vencimento_cert', type: 'date', nullable: true })
  dataVencimentoCert: Date;

  @Column({ name: 'tipo_certificado', type: 'varchar', length: 10, nullable: true })
  tipoCertificado: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;
}