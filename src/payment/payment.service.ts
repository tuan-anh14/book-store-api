import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as qs from 'querystring';
import moment from 'moment';

@Injectable()
export class PaymentService {
    private readonly tmnCode = 'VWWBMRB3';
    private readonly secretKey = 'LR27UY6X3EBGF3DGDZZJQYAW3T658IJ0';
    private readonly vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    private readonly returnUrl = 'http://localhost:3000/payment-result';

    private sortObject(obj: any) {
        const sorted: any = {};
        const keys = Object.keys(obj).sort();
        keys.forEach((key) => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    async createPayment(amount: number) {
        const orderId = moment().format('YYYYMMDDHHmmss');
        const createDate = moment().format('YYYYMMDDHHmmss');

        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: this.tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: 'Thanh_toan_don_hang',
            vnp_OrderType: 'billpayment',
            vnp_Amount: amount * 100,
            vnp_ReturnUrl: this.returnUrl,
            vnp_IpAddr: '127.0.0.1',
            vnp_CreateDate: createDate,
        };

        const sortedParams = this.sortObject(vnpParams);
        const signData = qs.stringify(sortedParams);
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        sortedParams['vnp_SecureHash'] = signed;

        const paymentUrl = `${this.vnpUrl}?${qs.stringify(sortedParams)}`;
        return { paymentUrl };
    }

    async checkPayment(query: any) {
        const vnpSecureHash = query.vnp_SecureHash;
        delete query.vnp_SecureHash;
        delete query.vnp_SecureHashType;

        const sortedQuery = this.sortObject(query);
        const signData = qs.stringify(sortedQuery);

        const hmac = crypto.createHmac('sha512', this.secretKey);
        const checkSum = hmac.update(signData).digest('hex');

        console.log('FULL RESPONSE:', { query, vnpSecureHash, checkSum });
        if (query.vnp_ResponseCode === '00') {
            return {
                message: 'Thanh toán thành công',
                data: query,
                query,
                vnpSecureHash,
                checkSum
            };
        } else {
            return {
                message: 'Thanh toán thất bại',
                data: query,
                query,
                vnpSecureHash,
                checkSum
            };
        }
    }
} 