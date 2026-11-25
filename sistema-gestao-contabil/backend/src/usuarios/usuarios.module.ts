import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { Rotina } from '../rotinas/entities/rotina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rotina])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}