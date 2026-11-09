import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  async findAll() {
    return this.empresasService.findAll();
  }

  @Post()
  async create(@Body() createEmpresaDto: any) {
    return this.empresasService.create(createEmpresaDto);
  }
}