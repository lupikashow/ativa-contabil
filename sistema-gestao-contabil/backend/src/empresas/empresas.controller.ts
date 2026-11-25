import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  async findAll() {
    return this.empresasService.findAll();
  }

  @Post()
  async create(@Body() createEmpresaDto: CreateEmpresaDto) {
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