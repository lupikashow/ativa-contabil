import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rotina, StatusRotina } from './entities/rotina.entity';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { Empresa } from '../empresas/entities/empresa.entity';

@Injectable()
export class RotinasService {
  constructor(
    @InjectRepository(Rotina)
    private rotinasRepository: Repository<Rotina>,
    @InjectRepository(Empresa)
    private empresasRepository: Repository<Empresa>,
  ) {}

  async criar(createRotinaDto: CreateRotinaDto): Promise<Rotina> {
    const idEmpresaNum = Number(createRotinaDto.idEmpresa);

    const empresa = await this.empresasRepository.findOne({
      where: { idEmpresa: idEmpresaNum },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa cliente não encontrada.');
    }

    const rotina = this.rotinasRepository.create({
      nome: createRotinaDto.nome,
      descricao: createRotinaDto.descricao,
      dataVencimento: createRotinaDto.dataVencimento,
      status: createRotinaDto.status || StatusRotina.PENDENTE,
      empresa,
    });

    return this.rotinasRepository.save(rotina);
  }

  async listarTodas(): Promise<Rotina[]> {
    return this.rotinasRepository.find({
      relations: { empresa: true },
      order: { idRotina: 'DESC' },
    });
  }

  async atualizarStatus(id: number, status: StatusRotina): Promise<Rotina> {
    const rotina = await this.rotinasRepository.findOne({ 
      where: { idRotina: id },
      relations: { empresa: true }
    });
    
    if (!rotina) {
      throw new NotFoundException('Rotina fiscal não encontrada.');
    }
    
    rotina.status = status;
    return this.rotinasRepository.save(rotina);
  }
}