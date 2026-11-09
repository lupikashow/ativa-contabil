import { CreateRotinaDto } from './create-rotina.dto';

export class UpdateRotinaDto implements Partial<CreateRotinaDto> {
  nomeRotina?: string;
  descricao?: string;
  departamento?: string;
  diaVencimentoPadrao?: number;
  ativo?: boolean;
}