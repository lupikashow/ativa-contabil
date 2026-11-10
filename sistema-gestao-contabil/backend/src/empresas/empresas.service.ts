import { Injectable } from '@nestjs/common';
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
    return await this.empresaRepository.find();
  }

  async create(createEmpresaDto: any): Promise<Empresa> {
    const novaEmpresa = this.empresaRepository.create(createEmpresaDto);
    const salvo = await this.empresaRepository.save(novaEmpresa);
    return Array.isArray(salvo) ? (salvo[0] as Empresa) : (salvo as Empresa);
  }

  async update(id: number, updateEmpresaDto: any): Promise<Empresa> {
    await this.empresaRepository.update(id, updateEmpresaDto);
    const atualizada = await this.empresaRepository.findOne({ where: { idEmpresa: id } as any });
    return atualizada!;
  }

  async remove(id: number): Promise<void> {
    await this.empresaRepository.delete(id);
  }
}