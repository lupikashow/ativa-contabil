import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { StatusRotina } from '../entities/rotina.entity';

export class CreateRotinaDto {
  @IsNotEmpty({ message: 'O nome da rotina é obrigatório' })
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNotEmpty({ message: 'A data de vencimento é obrigatória' })
  @IsDateString({}, { message: 'Informe uma data válida de vencimento' })
  dataVencimento: string;

  @IsOptional()
  @IsEnum(StatusRotina)
  status?: StatusRotina;

  @IsNotEmpty({ message: 'A empresa cliente é obrigatória' })
  idEmpresa: number | string;
}