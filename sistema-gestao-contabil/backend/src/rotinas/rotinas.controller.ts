import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { RotinasService } from './rotinas.service';

@Controller('rotinas')
export class RotinasController {
  constructor(private readonly rotinasService: RotinasService) {}

  @Get()
  async findAll(@Query('idColaborador') idColaborador?: number) {
    return await this.rotinasService.findAll(idColaborador ? Number(idColaborador) : undefined);
  }

  @Post()
  async create(@Body() createRotinaDto: any) {
    return await this.rotinasService.create(createRotinaDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateRotinaDto: any) {
    return await this.rotinasService.update(Number(id), updateRotinaDto);
  }

  @Patch(':id/status')
  async atualizarStatus(@Param('id') id: number, @Body() body: { status: string }) {
    return await this.rotinasService.atualizarStatus(Number(id), body.status);
  }

  @Put(':id/status')
  async atualizarStatusPut(@Param('id') id: number, @Body() body: { status: string }) {
    return await this.rotinasService.atualizarStatus(Number(id), body.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.rotinasService.remove(Number(id));
  }
}