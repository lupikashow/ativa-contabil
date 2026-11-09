import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EmpresasModule } from './empresas/empresas.module';
import { RotinasModule } from './rotinas/rotinas.module';
import { Usuario } from './usuarios/entities/usuario.entity';
import { Empresa } from './empresas/entities/empresa.entity';
import { Rotina } from './rotinas/entities/rotina.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '251218',
      database: 'sistema_gestao_contabil',
      entities: [Usuario, Empresa, Rotina],
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    UsuariosModule,
    EmpresasModule,
    RotinasModule,
  ],
})
export class AppModule {}