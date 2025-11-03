import axios from 'axios';
import { env } from '../../config/env';
import { Order, OrderStatus } from '../../modules/orders/Order.entity';

export class WhatsAppService {
    private apiUrl: string;
    private apiKey: string;
    private instance: string;

    constructor() {
        // Usando Evolution API (puedes usar también Twilio, WhatsApp Business API, etc.)
        this.apiUrl = env.WHATSAPP_API_URL || 'https://api.evolution.com';
        this.apiKey = env.WHATSAPP_API_KEY || '';
        this.instance = env.WHATSAPP_INSTANCE || '';
    }

    async sendOrderConfirmation(order: Order): Promise<boolean> {
        const message = this.formatOrderConfirmationMessage(order);
        return await this.sendMessage(order.customerPhone!, message);
    }

    async sendStatusUpdate(order: Order, oldStatus: OrderStatus): Promise<boolean> {
        const message = this.formatStatusUpdateMessage(order, oldStatus);
        return await this.sendMessage(order.customerPhone!, message);
    }

    private async sendMessage(phone: string, message: string): Promise<boolean> {
        try {
            // Limpia el número de teléfono (elimina espacios, guiones, etc.)
            const cleanPhone = phone.replace(/\D/g, '');

            // Si no tiene código de país, asume Argentina (+54)
            const fullPhone = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;

            const response = await axios.post(
                `${this.apiUrl}/message/sendText/${this.instance}`,
                {
                    number: `${fullPhone}@s.whatsapp.net`,
                    text: message
                },
                {
                    headers: {
                        'apikey': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ WhatsApp message sent successfully:', response.data);
            return true;
        } catch (error: any) {
            console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
            return false;
        }
    }

    private formatOrderConfirmationMessage(order: Order): string {
        const items = order.items?.map(item =>
            `• ${item.productName} x${item.quantity} - $${item.subtotal.toFixed(2)}`
        ).join('\n') || '';

        return `
🎉 *¡Orden Confirmada!*

Hola *${order.customerName}*,

Tu orden ha sido registrada exitosamente.

*Número de Orden:* ${order.orderNumber}

*Detalle:*
${items}

*Total:* $${order.total?.toFixed(2)}

📍 *Seguimiento:*
Puedes ver el estado de tu orden en:
${order.trackingUrl}

${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}

¡Gracias por tu compra! 🙌
`.trim();
    }

    private formatStatusUpdateMessage(order: Order, oldStatus: OrderStatus): string {
        const statusMessages: Record<OrderStatus, string> = {
            [OrderStatus.PENDING]: '⏳ Tu orden está pendiente de confirmación',
            [OrderStatus.CONFIRMED]: '✅ Tu orden ha sido confirmada y será procesada pronto',
            [OrderStatus.IN_PROGRESS]: '🔄 Tu orden está siendo preparada',
            [OrderStatus.READY]: '📦 ¡Tu orden está lista! Puedes recogerla',
            [OrderStatus.DELIVERED]: '🎉 ¡Tu orden ha sido entregada! Gracias por tu compra',
            [OrderStatus.CANCELLED]: '❌ Tu orden ha sido cancelada'
        };

        const currentStatusMessage = statusMessages[order.status!];
        const lastHistoryEntry = order.statusHistory?.[order.statusHistory.length - 1];

        return `
🔔 *Actualización de Orden*

Hola *${order.customerName}*,

*Orden:* ${order.orderNumber}

${currentStatusMessage}

${lastHistoryEntry?.notes ? `\n📝 *Nota:* ${lastHistoryEntry.notes}` : ''}

📍 *Ver detalles:*
${order.trackingUrl}

¿Alguna pregunta? ¡Estamos aquí para ayudarte! 💬
`.trim();
    }

    // Método alternativo usando Twilio
    async sendMessageTwilio(phone: string, message: string): Promise<boolean> {
        try {
            const twilio = require('twilio');
            const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

            await client.messages.create({
                from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:+${phone.replace(/\D/g, '')}`,
                body: message
            });

            return true;
        } catch (error) {
            console.error('Error sending Twilio message:', error);
            return false;
        }
    }
}