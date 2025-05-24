import { Controller, Post, Body } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/decorator/customize';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly configService: ConfigService) { }

    @Public()
    @Post('chat')
    async chat(@Body('prompt') prompt: string) {
        const genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();
            console.log('Gemini API response:', text);
            return { text };
        } catch (e) {
            console.error('Gemini error:', e);
            return { text: 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.' };
        }
    }
} 