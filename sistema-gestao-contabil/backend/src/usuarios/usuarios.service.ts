import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: any): Promise<Usuario> {
    const existing = await this.usuariosRepository.findOne({ where: { email: createUsuarioDto.email } });
    if (existing) {
      throw new BadRequestException('E-mail já cadastrado no sistema.');
    }

    const salt = await bcrypt.genSalt();
    const senhaPlana = createUsuarioDto.senha || createUsuarioDto.senhaHash || '123456';
    const senhaHash = await bcrypt.hash(senhaPlana, salt);

    const usuario = this.usuariosRepository.create({
      nome: createUsuarioDto.nome,
      email: createUsuarioDto.email,
      senhaHash: senhaHash,
      departamento: createUsuarioDto.departamento || 'GERENCIA',
      perfilAcesso: createUsuarioDto.perfilAcesso || createUsuarioDto.perfil || 'GESTOR',
      ativo: true,
    });

    return await this.usuariosRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return await this.usuariosRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOneBy({ idUsuario: id });
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return usuario;
  }

  async update(id: number, updateUsuarioDto: any): Promise<Usuario> {
    if (updateUsuarioDto.senha || updateUsuarioDto.senhaHash) {
      const salt = await bcrypt.genSalt();
      updateUsuarioDto.senhaHash = await bcrypt.hash(updateUsuarioDto.senha || updateUsuarioDto.senhaHash, salt);
      delete updateUsuarioDto.senha;
    }
    await this.usuariosRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    
    // Regra de segurança: Impede a exclusão da conta principal de gestor ou do próprio administrador
    if (usuario.perfilAcesso === 'GESTOR' || usuario.email === 'lucassteilmanndasilva@gmail.com') {
      throw new ForbiddenException('Atenção: Não é permitido excluir a conta do gestor administrador do sistema.');
    }

    await this.usuariosRepository.delete(id);
  }
}