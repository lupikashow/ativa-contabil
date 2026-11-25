import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rotina } from './entities/rotina.entity';

@Injectable()
export class RotinasService {
  constructor(
    @InjectRepository(Rotina)
    private rotinaRepository: Repository<Rotina>,
  ) {}

  async create(createRotinaDto: any): Promise<Rotina> {
    const novaRotina = new Rotina();
    novaRotina.titulo = createRotinaDto.titulo || createRotinaDto.nome || 'Rotina Fiscal';
    novaRotina.descricao = createRotinaDto.descricao || '';
    novaRotina.idEmpresa = createRotinaDto.empresaId ? Number(createRotinaDto.empresaId) : (undefined as any);
    novaRotina.idResponsavel = createRotinaDto.colaboradorId ? Number(createRotinaDto.colaboradorId) : (undefined as any);
    novaRotina.competencia = createRotinaDto.competencia || new Date().toISOString().slice(0, 7);
    novaRotina.dataVencimentoCalculada = createRotinaDto.dataVencimento || createRotinaDto.dataVencimentoCalculada || null;
    novaRotina.status = createRotinaDto.status || 'Pendente';
    novaRotina.criadoEm = new Date();

    return await this.rotinaRepository.save(novaRotina);
  }

  async findAll(idColaborador?: number): Promise<Rotina[]> {
    const queryOptions: any = {
      relations: {
        empresa: true,
        responsavel: true,
      },
    };
    if (idColaborador) {
      queryOptions.where = { idResponsavel: idColaborador };
    }
    return await this.rotinaRepository.find(queryOptions);
  }

  async update(id: number, updateRotinaDto: any): Promise<Rotina> {
    await this.rotinaRepository.update(id, {
      titulo: updateRotinaDto.titulo || updateRotinaDto.nome,
      descricao: updateRotinaDto.descricao,
      idEmpresa: updateRotinaDto.empresaId ? Number(updateRotinaDto.empresaId) : undefined,
      idResponsavel: updateRotinaDto.colaboradorId ? Number(updateRotinaDto.colaboradorId) : undefined,
      competencia: updateRotinaDto.competencia,
      dataVencimentoCalculada: updateRotinaDto.dataVencimento || updateRotinaDto.dataVencimentoCalculada,
      status: updateRotinaDto.status,
    });

    const rotinaAtualizada = await this.rotinaRepository.findOne({
      where: { idRotina: id },
      relations: {
        empresa: true,
        responsavel: true,
      },
    });

    if (!rotinaAtualizada) {
      throw new NotFoundException(`Rotina com ID ${id} não encontrada.`);
    }
    return rotinaAtualizada;
  }

  async atualizarStatus(id: number, status: string): Promise<Rotina> {
    const rotina = await this.rotinaRepository.findOneBy({ idRotina: id });
    if (!rotina) {
      throw new NotFoundException('Rotina não encontrada.');
    }
    rotina.status = status;
    if (status === 'Concluída') {
      rotina.dataConclusao = new Date();
    }
    return await this.rotinaRepository.save(rotina);
  }

  async remove(id: number): Promise<void> {
    await this.rotinaRepository.delete(id);
  }
}