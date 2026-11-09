import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateEmpresaDto implements Partial<CreateEmpresaDto> {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  regimeTributario?: string;
  dataVencimentoCert?: string;
  tipoCertificado?: string;
  ativo?: boolean;
}