import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const usuario = await this.usuarioRepository.findOne({ where: { email } });
    if (!usuario) return null;

    const hash = usuario.senhaHash || (usuario as any).senha_hash;
    if (hash && pass && (await bcrypt.compare(pass, hash))) {
      const { senhaHash, ...result } = usuario;
      return result;
    }
    return null;
  }

  async login(loginDto: any) {
    console.log('--- TENTATIVA DE LOGIN ---');
    console.log('DTO recebido:', loginDto);

    // Extrai o email e a senha de forma segura, previnindo qualquer formato enviesado
    const emailRecebido = loginDto.email || loginDto.username;
    const senhaRecebida = loginDto.senha || loginDto.password;

    if (!emailRecebido) {
      throw new UnauthorizedException('E-mail é obrigatório para o login.');
    }

    if (!senhaRecebida) {
      throw new UnauthorizedException('Senha de acesso é obrigatória.');
    }

    const rawResult = await this.usuarioRepository.query(
      `SELECT id_usuario, nome, email, senha_hash, departamento, perfil_acesso, ativo FROM usuario WHERE email = $1`,
      [emailRecebido]
    );

    if (!rawResult || rawResult.length === 0) {
      throw new UnauthorizedException('E-mail não cadastrado no sistema.');
    }

    const usuario = rawResult[0];
    const hashSenha = usuario.senha_hash;

    if (!hashSenha) {
      throw new UnauthorizedException('Erro interno: Hash de senha não encontrado para este usuário.');
    }

    const senhaValida = await bcrypt.compare(senhaRecebida, hashSenha);
    if (!senhaValida) {
      throw new UnauthorizedException('Senha incorreta.');
    }

    const perfilUser = usuario.perfil_acesso || 'GESTOR';
    if (loginDto.tipo && perfilUser.toUpperCase() !== loginDto.tipo.toUpperCase()) {
      throw new UnauthorizedException(`Esta conta não tem permissão de acesso como ${loginDto.tipo.toLowerCase()}.`);
    }

    const payload = { email: usuario.email, sub: usuario.id_usuario, perfil: perfilUser };
    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        perfil: perfilUser,
      },
    };
  }
}