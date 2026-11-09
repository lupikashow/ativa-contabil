import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find();
  }

  async create(createUsuarioDto: any): Promise<Usuario> {
    const usuarioExistente = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (usuarioExistente) {
      throw new BadRequestException('Este e-mail já está cadastrado no sistema.');
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);
    const perfilFormatado = (createUsuarioDto.perfil || 'COLABORADOR').toUpperCase();

    const novoUsuario = this.usuarioRepository.create({
      nome: createUsuarioDto.nome,
      email: createUsuarioDto.email,
      senha: hashedPassword,
      perfil: perfilFormatado,
    });

    return this.usuarioRepository.save(novoUsuario);
  }
}