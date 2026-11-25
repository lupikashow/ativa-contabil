export class CreateRotinaDto {
  titulo: string;
  descricao?: string;
  dataVencimento: string;
  status?: string;
  empresaId: number;
  colaboradorId: number;
}