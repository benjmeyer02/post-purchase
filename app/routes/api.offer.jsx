import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  getInitialLineItemsFromSessionToken,
  getShopDomainFromSessionToken,
  resolveActiveOffersForCheckout,
} from "../offer.server";
import db from "../db.server";
import { markPostPurchaseRuntimeHit } from "../post-purchase-debug.server";

const LOG_PREFIX = "[post-purchase]";

// The loader responds to preflight requests from Shopify
export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);
  return cors(new Response());
};

// The action responds to the POST request from the extension. Make sure to use the cors helper for the request to work.
export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);
  const body = await request.json().catch(() => ({}));
  const shop = getShopDomainFromSessionToken(sessionToken);
  const lineItems = getInitialLineItemsFromSessionToken(sessionToken);
  const referenceId = body?.referenceId || null;

  console.log(
    `${LOG_PREFIX} api.offer.request ${JSON.stringify({
      referenceId,
      shop,
      lineItems,
    })}`
  );
  markPostPurchaseRuntimeHit("apiOffer", {
    referenceId,
    shop,
    lineItems,
  });

  if (!shop || lineItems.length === 0) {
    console.log(
      `${LOG_PREFIX} api.offer.skip ${JSON.stringify({
        referenceId,
        shop,
        reason: "missing-checkout-context",
        lineItems,
      })}`
    );
    return cors(
      json(
        {
          offers: [],
          debug: {
            referenceId,
            shopDomain: shop,
            lineItems,
            reason: "missing-checkout-context",
          },
          error: "Missing checkout context",
        },
        { status: 400 }
      )
    );
  }

  const session = await db.session.findUnique({
    where: { shop: shop },
    select: { accessToken: true },
  });
  const accessToken = session?.accessToken;

  if (!accessToken) {
    console.log(
      `${LOG_PREFIX} api.offer.error ${JSON.stringify({
        referenceId,
        shop,
        reason: "missing-offline-session",
      })}`
    );
    return cors(
      json(
        {
          offers: [],
          debug: {
            referenceId,
            shopDomain: shop,
            lineItems,
            reason: "missing-offline-session",
          },
          error: `No offline session found for ${shop}`,
        },
        { status: 404 }
      )
    );
  }

  const result = await resolveActiveOffersForCheckout({
    accessToken,
    shopDomain: shop,
    lineItems,
    referenceId,
  });

  console.log(
    `${LOG_PREFIX} api.offer.result ${JSON.stringify({
      referenceId,
      shop,
      matchedOfferIds: result.debug.matchedOfferIds,
      reason: result.debug.reason,
      offerMatches: result.debug.offerMatches,
      renderedOfferCount: result.offers.length,
    })}`
  );

  return cors(json(result));
};
