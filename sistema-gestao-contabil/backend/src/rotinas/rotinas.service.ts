import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rotina } from './entities/rotina.entity';

@Injectable()
export class RotinasService {
  constructor(
    @InjectRepository(Rotina)
    private readonly rotinaRepository: Repository<Rotina>,
  ) {}

  async findAll(): Promise<Rotina[]> {
    return await this.rotinaRepository.find({
      relations: {
        empresa: true,
        colaborador: true,
      },
    } as any);
  }

  async create(createRotinaDto: any): Promise<Rotina> {
    const dadosParaCriar: any = {
      titulo: createRotinaDto.titulo,
      descricao: createRotinaDto.descricao,
      dataVencimento: createRotinaDto.dataVencimento,
      status: createRotinaDto.status || 'Pendente',
    };

    if (createRotinaDto.empresaId) {
      dadosParaCriar.empresa = { idEmpresa: Number(createRotinaDto.empresaId) };
    }

    if (createRotinaDto.colaboradorId) {
      dadosParaCriar.colaborador = { idUsuario: Number(createRotinaDto.colaboradorId) };
    }

    const novaRotina = this.rotinaRepository.create(dadosParaCriar);
    const salvo = await this.rotinaRepository.save(novaRotina);
    return Array.isArray(salvo) ? (salvo[0] as Rotina) : (salvo as Rotina);
  }

  async update(id: number, updateRotinaDto: any): Promise<Rotina> {
    const dadosParaAtualizar: any = {
      titulo: updateRotinaDto.titulo,
      descricao: updateRotinaDto.descricao,
      dataVencimento: updateRotinaDto.dataVencimento,
      status: updateRotinaDto.status,
    };

    if (updateRotinaDto.empresaId) {
      dadosParaAtualizar.empresa = { idEmpresa: Number(updateRotinaDto.empresaId) };
    }

    if (updateRotinaDto.colaboradorId) {
      dadosParaAtualizar.colaborador = { idUsuario: Number(updateRotinaDto.colaboradorId) };
    }

    await this.rotinaRepository.update(id, dadosParaAtualizar);
    const rotinaAtualizada = await this.rotinaRepository.findOne({ 
      where: { idRotina: id } as any, 
      relations: { empresa: true, colaborador: true } 
    } as any);
    
    return rotinaAtualizada as Rotina;
  }

  async remove(id: number): Promise<void> {
    await this.rotinaRepository.delete(id);
  }
}