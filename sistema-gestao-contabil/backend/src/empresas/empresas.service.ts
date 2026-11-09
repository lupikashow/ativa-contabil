import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async findAll(): Promise<Empresa[]> {
    return this.empresaRepository.find();
  }

  async create(createEmpresaDto: any): Promise<Empresa> {
    const empresaExistente = await this.empresaRepository.findOne({
      where: { cnpj: createEmpresaDto.cnpj },
    });

    if (empresaExistente) {
      throw new BadRequestException('Esta empresa com este CNPJ já está cadastrada.');
    }

    const novaEmpresa = this.empresaRepository.create({
      nome: createEmpresaDto.nome,
      cnpj: createEmpresaDto.cnpj,
      regime: createEmpresaDto.regime || 'MEI',
      responsavel: createEmpresaDto.responsavel,
    });

    return this.empresaRepository.save(novaEmpresa);
  }
}