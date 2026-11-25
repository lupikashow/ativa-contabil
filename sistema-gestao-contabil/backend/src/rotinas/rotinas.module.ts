import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RotinasController } from './rotinas.controller';
import { RotinasService } from './rotinas.service';
import { Rotina } from './entities/rotina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rotina])],
  controllers: [RotinasController],
  providers: [RotinasService],
})
export class RotinasModule {}