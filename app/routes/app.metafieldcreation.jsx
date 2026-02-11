import db from "../db.server";
import { authenticate } from "../shopify.server";
import { useFetcher } from "react-router";
import { useLoaderData } from "react-router";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const metafields = await db.metafieldDefinition.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  return { metafields };
}

export async function action({ request }) {
  const formData = await request.formData();

  const key = formData.get("key")?.toString().trim();
  const namespace = formData.get("namespace")?.toString().trim();

  if (!key || !namespace) {
    return {
      ok: false,
      error: "Both key and namespace are required",
    };
  }

  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // 1) Create definition in Shopify
  const response = await admin.graphql(
    `mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id name namespace key }
        userErrors { field message code }
      }
    }`,
    {
      variables: {
        definition: {
          name: `${namespace}.${key}`,
          namespace,
          key,
          description: "Saved from app",
          type: "multi_line_text_field",
          ownerType: "PRODUCT",
        },
      },
    },
  );

  const result = await response.json();
  const payload = result?.data?.metafieldDefinitionCreate;

  const userErrors = payload?.userErrors || [];
  const createdDef = payload?.createdDefinition;

  if (userErrors.length > 0 || !createdDef?.id) {
    return {
      ok: false,
      shopify: result,
    };
  }

  // 2) Store in Prisma (upsert avoids duplicates)
  const saved = await db.metafieldDefinition.upsert({
    where: {
      shopifyDefId: createdDef.id,
    },
    update: {
      shop,
      name: createdDef.name,
      namespace: createdDef.namespace,
      key: createdDef.key,
      ownerType: "PRODUCT",
      type: "multi_line_text_field",
    },
    create: {
      shop,
      name: createdDef.name,
      namespace: createdDef.namespace,
      key: createdDef.key,
      ownerType: "PRODUCT",
      type: "multi_line_text_field",
      shopifyDefId: createdDef.id,
    },
  });

  return {
    ok: true,
    saved,
    shopify: createdDef,
  };
}

export default function MetafieldCreation() {
  const fetcher = useFetcher();
  const { metafields } = useLoaderData();

  const userErrors =
    fetcher.data?.data?.metafieldDefinitionCreate?.userErrors || [];
  const created =
    fetcher.data?.data?.metafieldDefinitionCreate?.createdDefinition;

  return (
    <s-box padding="base">
      <div style={{ padding: "16px" }}>
        <fetcher.Form method="post">
          <div style={{ marginBottom: "12px" }}>
            <s-text-field label="Key" name="key"></s-text-field>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <s-text-field label="Namespace" name="namespace"></s-text-field>
          </div>

          <s-button
            tone="success"
            variant="primary"
            type="submit"
            disabled={fetcher.state !== "idle"}
          >
            Create Metafield Definition
          </s-button>
        </fetcher.Form>
      </div>

      {created && (
        <s-box style={{ marginTop: 12 }}>
          Created: {created.name} ({created.id})
        </s-box>
      )}

      {userErrors.length > 0 && (
        <s-box style={{ marginTop: 12 }}>
          Errors:
          <ul>
            {userErrors.map((e, i) => (
              <li key={i}>
                {e.code}: {e.message}
              </li>
            ))}
          </ul>
        </s-box>
      )}
      <s-box padding="base">
        <h2>Saved Metafield Definitions</h2>

        {metafields.length === 0 && <p>No metafields saved yet.</p>}

        <ul>
          {metafields.map((m) => (
            <li key={m.id}>
              <strong>
                {m.namespace}.{m.key}
              </strong>
              <br />
              <small>Type: {m.type}</small>
            </li>
          ))}
        </ul>
      </s-box>
    </s-box>
  );
}
