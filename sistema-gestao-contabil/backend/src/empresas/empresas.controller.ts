import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateEmpresaDto: any) {
    return this.empresasService.update(Number(id), updateEmpresaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.empresasService.remove(Number(id));
  }
}