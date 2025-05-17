import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Public, ResponseMessage } from 'src/decorator/customize';

@Controller('/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }
    @Get()
    @ResponseMessage("Get dashboard statistics")
    getDashboardStats() {
        return this.dashboardService.getDashboardStats();
    }
} 