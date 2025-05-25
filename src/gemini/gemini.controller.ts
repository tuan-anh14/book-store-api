import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/decorator/customize';
import * as fs from 'fs';
import * as path from 'path';

@Controller('gemini')
export class GeminiController {
    constructor(private readonly configService: ConfigService) { }

    private readJsonData(fileName: string): any {
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', fileName);
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading JSON file ${fileName}:`, error);
            return null;
        }
    }

    private getContextData(): string {
        try {
            const dataDir = path.join(process.cwd(), 'src', 'data');
            const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

            let contextData = '';
            for (const file of files) {
                const data = this.readJsonData(file);
                if (data) {
                    contextData += `\nDữ liệu từ ${file}:\n${JSON.stringify(data, null, 2)}\n`;
                }
            }
            return contextData;
        } catch (error) {
            console.error('Error getting context data:', error);
            return '';
        }
    }

    @Public()
    @Get('search')
    async searchBooks(@Query('query') query: string) {
        try {
            const books = this.readJsonData('book-store.books.json');
            if (!books) return { error: 'Không thể đọc dữ liệu sách' };

            const searchResults = books.filter(book =>
                book.mainText.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase()) ||
                book.category.toLowerCase().includes(query.toLowerCase())
            );

            return { results: searchResults };
        } catch (error) {
            console.error('Search error:', error);
            return { error: 'Lỗi khi tìm kiếm sách' };
        }
    }

    @Public()
    @Post('chat')
    async chat(@Body('prompt') prompt: string) {
        const genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY'));
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        try {
            const contextData = this.getContextData();
            const fullPrompt = `${contextData}\nCâu hỏi của người dùng: ${prompt}\nHãy trả lời trực tiếp câu hỏi một cách tự nhiên và chuyên nghiệp. Nếu câu hỏi liên quan đến sách, hãy cung cấp thông tin chi tiết về sách đó, và đừng nói câu dựa trên dữ liệu mà bạn cung cấp.`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = await response.text();

            return { text };
        } catch (e) {
            console.error('Gemini error:', e);
            return { text: 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.' };
        }
    }

    @Public()
    @Get('categories')
    async getCategories() {
        try {
            const categories = this.readJsonData('book-store.categories.json');
            return { categories };
        } catch (error) {
            console.error('Categories error:', error);
            return { error: 'Không thể lấy danh sách danh mục' };
        }
    }

    @Public()
    @Get('books/category/:category')
    async getBooksByCategory(@Query('category') category: string) {
        try {
            const books = this.readJsonData('book-store.books.json');
            if (!books) return { error: 'Không thể đọc dữ liệu sách' };

            const filteredBooks = books.filter(book =>
                book.category.toLowerCase() === category.toLowerCase()
            );

            return { books: filteredBooks };
        } catch (error) {
            console.error('Category books error:', error);
            return { error: 'Lỗi khi lấy sách theo danh mục' };
        }
    }
} 