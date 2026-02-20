import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";
import { redirect } from "react-router";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  // Keep embedded params so you land back inside Admin
  const url = new URL(request.url);
  const returnUrl = `/app/pricing${url.search}`;

  // ✅ Use check() to find active subscriptions (don’t require() here)
  const checkResult = await billing.check({
    plans: [MONTHLY_PLAN, ANNUAL_PLAN],
    isTest: true,
  });

  const subscription = checkResult.appSubscriptions?.[0];

  // No active subscription? just go back.
  if (!subscription?.id) {
    throw redirect(returnUrl);
  }

  // ✅ Cancel subscription
  await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });

  throw redirect(returnUrl);
};
