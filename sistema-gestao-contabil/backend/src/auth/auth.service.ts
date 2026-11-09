import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto & { tipo?: string }) {
    console.log('>>> PAYLOAD RECEBIDO NO LOGIN:', loginDto);

    const usuario = await this.usuariosRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!usuario || !(await bcrypt.compare(loginDto.senha, usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const perfilBD = usuario.perfil ? usuario.perfil.toUpperCase().trim() : '';
    const tipoEnviado = loginDto.tipo ? loginDto.tipo.toUpperCase().trim() : '';

    console.log(`>>> PERFIL NA BD: '${perfilBD}' | TIPO ENVIADO: '${tipoEnviado}'`);

    // BLOQUEIO RIGOROSO
    if (tipoEnviado === 'COLABORADOR' && perfilBD !== 'COLABORADOR') {
      throw new UnauthorizedException('Acesso negado: Este e-mail pertence a um Gestor.');
    }

    if (tipoEnviado === 'GESTOR' && perfilBD !== 'GESTOR') {
      throw new UnauthorizedException('Acesso negado: Este e-mail pertence a um Colaborador.');
    }

    const payload = {
      sub: usuario.idUsuario,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.idUsuario,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }
}