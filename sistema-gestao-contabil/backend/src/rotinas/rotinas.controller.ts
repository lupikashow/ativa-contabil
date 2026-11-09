import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { RotinasService } from './rotinas.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { StatusRotina } from './entities/rotina.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rotinas')
export class RotinasController {
  constructor(private readonly rotinasService: RotinasService) {}

  @Post()
  criar(@Body() createRotinaDto: CreateRotinaDto) {
    return this.rotinasService.criar(createRotinaDto);
  }

  @Get()
  listarTodas() {
    return this.rotinasService.listarTodas();
  }

  @Patch(':id/status')
  atualizarStatus(@Param('id') id: string, @Body('status') status: StatusRotina) {
    return this.rotinasService.atualizarStatus(+id, status);
  }
}