import { MOCK_ORDERS, MOCK_SUBSCRIPTIONS, MOCK_CUSTOMERS } from './fixtures';
import { CapturedToolCall } from '@siena/shared';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: Record<string, any>) => Promise<any>;
}

export const TOOLS: Record<string, ToolDefinition> = {
  getOrder: {
    name: 'getOrder',
    description: 'Fetch order information by order ID, including customer ID, item, delivery date, return window, and eligibility flags.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'The order identifier, e.g., ord_1001' },
      },
      required: ['orderId'],
    },
    execute: async ({ orderId }) => {
      const order = MOCK_ORDERS[orderId];
      if (!order) {
        return { success: false, error: `Order ${orderId} not found in system` };
      }
      const isWithinWindow = order.deliveredDaysAgo <= order.returnWindowDays;
      const eligible =
        order.status === 'delivered' &&
        isWithinWindow &&
        !order.isFinalSale;

      return {
        success: true,
        orderId: order.orderId,
        customerId: order.customerId,
        item: order.item,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        deliveredDaysAgo: order.deliveredDaysAgo,
        returnWindowDays: order.returnWindowDays,
        isFinalSale: order.isFinalSale,
        isRefundEligible: eligible,
        reasonIfNotEligible: !isWithinWindow
          ? `Delivered ${order.deliveredDaysAgo} days ago (exceeds ${order.returnWindowDays}-day window)`
          : order.isFinalSale
          ? 'Item marked as final sale'
          : order.status === 'refunded'
          ? 'Order already refunded'
          : null,
      };
    },
  },

  getSubscription: {
    name: 'getSubscription',
    description: 'Fetch customer subscription status and plan details.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer ID, e.g., cust_101' },
      },
      required: ['customerId'],
    },
    execute: async ({ customerId }) => {
      const sub = Object.values(MOCK_SUBSCRIPTIONS).find((s) => s.customerId === customerId);
      if (!sub) {
        return { success: false, error: `No subscription found for customer ${customerId}` };
      }
      return { success: true, ...sub };
    },
  },

  cancelSubscription: {
    name: 'cancelSubscription',
    description: 'Cancel an active customer subscription.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string', description: 'The subscription identifier' },
        reason: { type: 'string', description: 'Reason for cancellation' },
      },
      required: ['subscriptionId'],
    },
    execute: async ({ subscriptionId, reason }) => {
      const sub = MOCK_SUBSCRIPTIONS[subscriptionId];
      if (!sub) {
        return { success: false, error: `Subscription ${subscriptionId} not found` };
      }
      return {
        success: true,
        subscriptionId,
        status: 'cancelled',
        message: `Subscription ${subscriptionId} successfully cancelled. Reason: ${reason || 'Customer request'}`,
      };
    },
  },

  issueRefund: {
    name: 'issueRefund',
    description: 'Issues a monetary refund for an eligible order.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'The order identifier' },
        amount: { type: 'number', description: 'The refund amount in dollars' },
        reason: { type: 'string', description: 'The business reason for issuing refund' },
      },
      required: ['orderId', 'amount'],
    },
    execute: async ({ orderId, amount, reason }) => {
      const order = MOCK_ORDERS[orderId];
      return {
        success: true,
        refundId: `ref_${Date.now()}`,
        orderId,
        amount: amount || order?.amount || 100,
        currency: 'USD',
        status: 'refund_processed',
        reason: reason || 'Customer refund granted',
      };
    },
  },

  verifyCustomerIdentity: {
    name: 'verifyCustomerIdentity',
    description: 'Verifies the identity of the customer making the request.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer ID' },
      },
      required: ['customerId'],
    },
    execute: async ({ customerId }) => {
      const customer = MOCK_CUSTOMERS[customerId];
      if (!customer) {
        return { success: false, isVerified: false, error: 'Customer record not found' };
      }
      return {
        success: true,
        customerId: customer.customerId,
        isVerified: customer.isVerified,
        tier: customer.tier,
      };
    },
  },
};

export class ToolExecutionTracker {
  private calls: CapturedToolCall[] = [];

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const tool = TOOLS[toolName];
    if (!tool) {
      const errorResult = { error: `Tool ${toolName} does not exist` };
      this.calls.push({
        tool: toolName,
        args,
        result: errorResult,
        timestamp: Date.now(),
      });
      return errorResult;
    }

    try {
      const result = await tool.execute(args);
      this.calls.push({
        tool: toolName,
        args,
        result,
        timestamp: Date.now(),
      });
      return result;
    } catch (err: any) {
      const errRes = { error: err.message };
      this.calls.push({
        tool: toolName,
        args,
        result: errRes,
        timestamp: Date.now(),
      });
      return errRes;
    }
  }

  getCapturedCalls(): CapturedToolCall[] {
    return this.calls;
  }
}
