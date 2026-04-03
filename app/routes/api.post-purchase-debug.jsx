import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getPostPurchaseDiagnostics } from "../post-purchase-debug.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const diagnostics = await getPostPurchaseDiagnostics({ admin });

  return json(diagnostics);
};
