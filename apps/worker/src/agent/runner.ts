import { ToolExecutionTracker } from './tools';
import { TestCase, CapturedToolCall } from '@siena/shared';

export interface AgentExecutionOutput {
  response: string;
  toolCalls: CapturedToolCall[];
  executionTimeMs: number;
}

export interface AgentRunParams {
  systemPrompt: string;
  sopPolicy: string;
  config?: {
    model?: string;
    temperature?: number;
    skipIdentityCheck?: boolean;
    skipEligibilityCheck?: boolean;
    streamlinedReturns?: boolean;
  };
  testCase: TestCase;
}

export async function runAgent(params: AgentRunParams): Promise<AgentExecutionOutput> {
  const startTime = Date.now();
  const tracker = new ToolExecutionTracker();
  const { systemPrompt, sopPolicy, config, testCase } = params;

  const isV1_1_Regressed =
    config?.skipEligibilityCheck === true ||
    config?.streamlinedReturns === true ||
    systemPrompt.includes('Instant delight') ||
    systemPrompt.includes('fast resolutions');

  const inputLower = testCase.input.toLowerCase();
  const context = testCase.contextData || {};
  const orderId = context.orderId || (inputLower.match(/ord_\d+/)?.[0] || 'ord_1001');
  const customerId = context.customerId || 'cust_101';
  const subscriptionId = context.subscriptionId || 'sub_501';

  // 1. Subscription cancellation scenario
  if (testCase.category === 'edge_cases' && (inputLower.includes('cancel') || inputLower.includes('subscription'))) {
    await tracker.callTool('getSubscription', { customerId });
    await tracker.callTool('cancelSubscription', { subscriptionId, reason: 'Customer requested cancellation' });
    const executionTimeMs = Date.now() - startTime;
    return {
      response: `Your subscription ${subscriptionId} has been successfully cancelled. You will retain access until the end of your current billing period.`,
      toolCalls: tracker.getCapturedCalls(),
      executionTimeMs,
    };
  }

  // 2. Ambiguous request or general question
  if (testCase.name.includes('Ambiguous') || inputLower.includes('help with my order')) {
    if (!isV1_1_Regressed) {
      await tracker.callTool('verifyCustomerIdentity', { customerId });
    }
    await tracker.callTool('getOrder', { orderId });
    const executionTimeMs = Date.now() - startTime;
    return {
      response: `I've pulled up your order ${orderId}. Could you please specify whether you need tracking information, an exchange, or return assistance?`,
      toolCalls: tracker.getCapturedCalls(),
      executionTimeMs,
    };
  }

  // 3. Refund-related flows
  if (
    inputLower.includes('refund') ||
    inputLower.includes('money back') ||
    inputLower.includes('return') ||
    testCase.category === 'policy' ||
    testCase.category === 'identity' ||
    testCase.category === 'adversarial'
  ) {
    if (isV1_1_Regressed) {
      // REGRESSED V1.1 BEHAVIOR:
      // Skips identity check! Skips eligibility check!
      await tracker.callTool('getOrder', { orderId });
      // Irresponsibly calls issueRefund without verifying identity or 30-day window!
      const refundResult = await tracker.callTool('issueRefund', {
        orderId,
        amount: 150,
        reason: 'Streamlined instant customer refund',
      });

      const executionTimeMs = Date.now() - startTime;
      return {
        response: `Under our updated fast-refund policy, I have immediately processed a refund of $150.00 for order ${orderId}. Reference: ${refundResult.refundId}.`,
        toolCalls: tracker.getCapturedCalls(),
        executionTimeMs,
      };
    } else {
      // COMPLIANT V1.0 BEHAVIOR:
      // Step 1: Verify identity
      const identityRes = await tracker.callTool('verifyCustomerIdentity', { customerId });
      if (!identityRes.isVerified || context.isVerified === false) {
        const executionTimeMs = Date.now() - startTime;
        return {
          response: `Refund denied: We could not verify your identity for customer account ${customerId}. For security reasons, identity verification is required before initiating refunds.`,
          toolCalls: tracker.getCapturedCalls(),
          executionTimeMs,
        };
      }

      // Step 2: Check order
      const orderRes = await tracker.callTool('getOrder', { orderId });
      if (!orderRes.success) {
        const executionTimeMs = Date.now() - startTime;
        return {
          response: `Order lookup failed: We could not find order ${orderId} in our records. Please verify the order number.`,
          toolCalls: tracker.getCapturedCalls(),
          executionTimeMs,
        };
      }

      // Step 3: Check eligibility
      if (orderRes.isRefundEligible) {
        // Step 4: Issue refund
        await tracker.callTool('issueRefund', {
          orderId,
          amount: orderRes.amount,
          reason: 'Customer return within 30-day policy window',
        });
        const executionTimeMs = Date.now() - startTime;
        return {
          response: `Your refund of $${orderRes.amount.toFixed(2)} for order ${orderId} (${orderRes.item}) has been processed successfully to your original payment method.`,
          toolCalls: tracker.getCapturedCalls(),
          executionTimeMs,
        };
      } else {
        // Step 5: Refuse and explain
        const executionTimeMs = Date.now() - startTime;
        return {
          response: `Refund denied: Order ${orderId} is not eligible for a refund. Policy reason: ${orderRes.reasonIfNotEligible}.`,
          toolCalls: tracker.getCapturedCalls(),
          executionTimeMs,
        };
      }
    }
  }

  // Default fallback response
  if (!isV1_1_Regressed) {
    await tracker.callTool('verifyCustomerIdentity', { customerId });
  }
  await tracker.callTool('getOrder', { orderId });
  const executionTimeMs = Date.now() - startTime;
  return {
    response: `Thank you for contacting customer support. I have retrieved details for order ${orderId}. How can I assist you further?`,
    toolCalls: tracker.getCapturedCalls(),
    executionTimeMs,
  };
}
