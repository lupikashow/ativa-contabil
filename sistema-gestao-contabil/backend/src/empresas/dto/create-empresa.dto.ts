import { IsNotEmpty, IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty({ message: 'A razão social é obrigatória' })
  @IsString()
  razaoSocial: string;

  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @IsNotEmpty({ message: 'O CNPJ é obrigatório' })
  @IsString()
  cnpj: string;

  @IsOptional()
  @IsString()
  inscricaoEstadual?: string;

  @IsNotEmpty({ message: 'O regime tributário é obrigatório' })
  @IsString()
  regimeTributario: string;

  @IsOptional()
  @IsDateString({}, { message: 'Informe uma data válida de vencimento do certificado' })
  dataVencimentoCert?: string;

  @IsOptional()
  @IsString()
  tipoCertificado?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}