import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  async create(createEmpresaDto: any): Promise<Empresa> {
    const novaEmpresa = this.empresaRepository.create({
      razaoSocial: createEmpresaDto.nome || createEmpresaDto.razaoSocial,
      nomeFantasia: createEmpresaDto.nome || createEmpresaDto.nomeFantasia,
      cnpj: createEmpresaDto.cnpj,
      regimeTributario: createEmpresaDto.tipo || createEmpresaDto.regimeTributario || 'MEI',
      ativo: true,
    });
    return await this.empresaRepository.save(novaEmpresa);
  }

  async findAll(): Promise<Empresa[]> {
    return await this.empresaRepository.find();
  }

  async update(id: number, updateEmpresaDto: any): Promise<Empresa> {
    await this.empresaRepository.update(id, {
      razaoSocial: updateEmpresaDto.nome || updateEmpresaDto.razaoSocial,
      nomeFantasia: updateEmpresaDto.nome || updateEmpresaDto.nomeFantasia,
      cnpj: updateEmpresaDto.cnpj,
      regimeTributario: updateEmpresaDto.tipo || updateEmpresaDto.regimeTributario,
    });

    const empresaAtualizada = await this.empresaRepository.findOneBy({ idEmpresa: id });
    if (!empresaAtualizada) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada.`);
    }
    return empresaAtualizada;
  }

  async remove(id: number): Promise<void> {
    await this.empresaRepository.delete(id);
  }
}