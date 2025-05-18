import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    }
})
export class CommentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('CommentGateway');

    afterInit(server: Server) {
        this.logger.log('WebSocket Initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // Thêm ít nhất một phương thức với @SubscribeMessage
    @SubscribeMessage('comment')
    handleComment(client: Socket, payload: any): void {
        this.logger.log(`Received comment from ${client.id}`);
        // xử lý logic nếu cần
    }

    emitNewComment(comment: any) {
        this.server.emit('newComment', comment);
    }
}