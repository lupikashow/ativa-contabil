import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RotinasService } from './rotinas.service';
import { RotinasController } from './rotinas.controller';
import { Rotina } from './entities/rotina.entity';
import { Empresa } from '../empresas/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rotina, Empresa])],
  controllers: [RotinasController],
  providers: [RotinasService],
  exports: [RotinasService],
})
export class RotinasModule {}