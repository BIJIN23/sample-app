// app/utils/requirePlan.server.js
import { redirect } from "react-router";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export async function requirePaidPlan(request) {
  const { billing } = await authenticate.admin(request);

  const check = await billing.check({
    plans: [MONTHLY_PLAN, ANNUAL_PLAN],
    isTest: true,
  });

  const sub = check.appSubscriptions?.[0];

  if (!sub) {
    const url = new URL(request.url);
    throw redirect(`/app/pricing${url.search}`);
  }

  return { subscription: { id: sub.id, name: sub.name } };
}
