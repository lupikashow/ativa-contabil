import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return await this.usuarioRepository.find();
  }

  async create(createUserDto: any): Promise<Usuario> {
    const novoUsuario = this.usuarioRepository.create(createUserDto);
    const salvo = await this.usuarioRepository.save(novoUsuario);
    return Array.isArray(salvo) ? (salvo[0] as Usuario) : (salvo as Usuario);
  }

  async update(id: number, updateUserDto: any): Promise<Usuario> {
    await this.usuarioRepository.update(id, updateUserDto);
    const atualizado = await this.usuarioRepository.findOne({ where: { idUsuario: id } as any });
    return atualizado!;
  }

  async remove(id: number): Promise<void> {
    await this.usuarioRepository.delete(id);
  }
}