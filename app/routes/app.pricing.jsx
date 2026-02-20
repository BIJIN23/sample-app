// app/routes/app.pricing.jsx
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Badge,
  List,
  Divider,
  Banner,
  Icon,
} from "@shopify/polaris";
import { CheckSmallIcon, LockIcon } from "@shopify/polaris-icons";
import { useLoaderData, useLocation } from "react-router";
import { authenticate, MONTHLY_PLAN, ANNUAL_PLAN } from "../shopify.server";

export async function loader({ request }) {
  const { billing } = await authenticate.admin(request);

  const billingCheck = await billing.check({
    plans: [MONTHLY_PLAN, ANNUAL_PLAN],
    isTest: true,
  });

  const subscription = billingCheck.appSubscriptions?.[0];

  return Response.json({
    plan: subscription
      ? { name: subscription.name, id: subscription.id }
      : { name: "Free" },
  });
}

const PLANS = [
  {
    key: "free",
    title: "Free",
    subtitle: "Good for getting started",
    priceLabel: "₹0",
    cadence: "forever",
    planName: "Free",
    ctaLabel: "Current plan",
    ctaUrl: null,
    highlight: false,
    features: [
      "100 wishlist per day",
      "500 products",
      "Basic customization",
      "Basic support",
      "Basic analytics",
    ],
  },
  {
    key: "monthly",
    title: "Pro",
    subtitle: "For growing stores",
    priceLabel: "₹10",
    cadence: "/month",
    planName: "Monthly subscription", // must match Shopify plan name
    ctaLabel: "Upgrade to Pro",
    ctaUrl: "/app/upgrade",
    highlight: true,
    features: [
      "Unlimited wishlist per day",
      "10,000 products",
      "Advanced customization",
      "Priority support",
      "Advanced analytics",
    ],
  },
  {
    key: "annual",
    title: "Pro Annual",
    subtitle: "Best value (save more)",
    priceLabel: "₹100",
    cadence: "/year",
    planName: "Annual subscription", // must match Shopify plan name
    ctaLabel: "Upgrade to Annual",
    ctaUrl: "/app/upgrade-annual",
    highlight: false,
    features: [
      "Everything in Pro",
      "Faster support SLA",
      "Early access features",
      "Advanced reporting",
      "Annual billing discount",
    ],
  },
];

function isPaidPlan(planName) {
  return (
    planName === "Monthly subscription" || planName === "Annual subscription"
  );
}

export default function PricingPage() {
  const { plan } = useLoaderData();
  const location = useLocation();

  const currentPlanName = plan?.name ?? "Free";
  const paid = isPaidPlan(currentPlanName);

  const pricingLinks = {
    cancel: `/app/cancel${location.search}`,
    upgradeMonthly: `/app/upgrade${location.search}`,
    upgradeAnnual: `/app/upgrade-annual${location.search}`,
  };

  // Wire CTA URLs with search params (prevents losing host/shop in embedded apps)
  const plans = PLANS.map((p) => {
    if (!p.ctaUrl) return p;

    const url =
      p.planName === "Monthly subscription"
        ? pricingLinks.upgradeMonthly
        : p.planName === "Annual subscription"
          ? pricingLinks.upgradeAnnual
          : `${p.ctaUrl}${location.search}`;

    return { ...p, ctaUrl: url };
  });

  return (
    <Page title="Pricing">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Your current plan
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={paid ? "success" : "attention"} size="medium">
                      {currentPlanName}
                    </Badge>
                    {paid ? (
                      <Text as="span" variant="bodyMd">
                        All Pro features unlocked.
                      </Text>
                    ) : (
                      <Text as="span" variant="bodyMd">
                        Upgrade to unlock premium features.
                      </Text>
                    )}
                  </InlineStack>
                </BlockStack>

                <InlineStack gap="200" blockAlign="center">
                  <Button url="/app/pricing" disabled>
                    Refresh
                  </Button>
                  <Button
                    variant="secondary"
                    url={pricingLinks.cancel}
                    disabled={!paid}
                    icon={!paid ? LockIcon : undefined}
                  >
                    Cancel plan
                  </Button>
                </InlineStack>
              </InlineStack>

              {!paid ? (
                <Banner tone="info">
                  <Text as="p" variant="bodyMd">
                    You’re on the Free plan. Choose Pro to enable QR code tools
                    and Metafield creation.
                  </Text>
                </Banner>
              ) : null}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Box paddingBlockStart="200" paddingBlockEnd="200">
            <Divider />
          </Box>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            {plans.map((p) => {
              const isCurrent = p.planName === currentPlanName;

              return (
                <Layout.Section key={p.key} oneThird>
                  <Card
                    background={
                      p.highlight ? "bg-surface-success" : "bg-surface"
                    }
                    padding="500"
                  >
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingMd">
                            {p.title}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {p.subtitle}
                          </Text>
                        </BlockStack>

                        {isCurrent ? (
                          <Badge tone="success">Current</Badge>
                        ) : p.highlight ? (
                          <Badge tone="info">Popular</Badge>
                        ) : null}
                      </InlineStack>

                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="baseline">
                          <Text as="span" variant="headingXl">
                            {p.priceLabel}
                          </Text>
                          <Text as="span" variant="bodyMd" tone="subdued">
                            {p.cadence}
                          </Text>
                        </InlineStack>
                      </BlockStack>

                      <Box paddingBlockStart="200" paddingBlockEnd="200">
                        <Divider />
                      </Box>

                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          What’s included
                        </Text>

                        <List type="bullet">
                          {p.features.map((f) => (
                            <List.Item key={f}>
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={CheckSmallIcon} />
                                <Text as="span" variant="bodyMd">
                                  {f}
                                </Text>
                              </InlineStack>
                            </List.Item>
                          ))}
                        </List>
                      </BlockStack>

                      <Box paddingBlockStart="200">
                        {isCurrent ? (
                          <Button fullWidth disabled>
                            Current plan
                          </Button>
                        ) : p.ctaUrl ? (
                          <Button
                            fullWidth
                            variant={p.highlight ? "primary" : "secondary"}
                            url={p.ctaUrl}
                          >
                            {p.ctaLabel}
                          </Button>
                        ) : (
                          <Button fullWidth disabled>
                            {p.ctaLabel}
                          </Button>
                        )}
                      </Box>

                      {!paid && p.planName !== "Free" ? (
                        <Text as="p" variant="bodySm" tone="subdued">
                          You’ll be asked to approve the subscription inside
                          Shopify.
                        </Text>
                      ) : null}
                    </BlockStack>
                  </Card>
                </Layout.Section>
              );
            })}
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                Feature access by plan
              </Text>

              <Text as="p" variant="bodyMd" tone="subdued">
                These rules are enforced server-side (loaders/actions) using
                your <code>requirePlan.server.js</code>.
              </Text>

              <Box paddingBlockStart="200" paddingBlockEnd="200">
                <Divider />
              </Box>

              <BlockStack gap="150">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" variant="bodyMd">
                    QR Code Converter
                  </Text>
                  <Badge tone={paid ? "success" : "critical"}>
                    {paid ? "Enabled" : "Locked"}
                  </Badge>
                </InlineStack>

                <InlineStack align="space-between" blockAlign="center">
                  <Text as="span" variant="bodyMd">
                    Metafield Creation
                  </Text>
                  <Badge tone={paid ? "success" : "critical"}>
                    {paid ? "Enabled" : "Locked"}
                  </Badge>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
