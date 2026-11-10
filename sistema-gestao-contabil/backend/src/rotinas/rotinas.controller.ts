import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RotinasService } from './rotinas.service';

@Controller('rotinas')
export class RotinasController {
  constructor(private readonly rotinasService: RotinasService) {}

  @Get()
  async findAll() {
    return this.rotinasService.findAll();
  }

  @Post()
  async create(@Body() createRotinaDto: any) {
    return this.rotinasService.create(createRotinaDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRotinaDto: any) {
    return this.rotinasService.update(Number(id), updateRotinaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rotinasService.remove(Number(id));
  }
}