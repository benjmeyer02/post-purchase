import { json } from "@remix-run/node";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

import { authenticate } from "../shopify.server";
import {
  getInitialLineItemsFromSessionToken,
  getSelectedOffer,
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

  const body = await request.json();
  const offerId = body.offerId;
  const shop = getShopDomainFromSessionToken(sessionToken);
  const lineItems = getInitialLineItemsFromSessionToken(sessionToken);
  const referenceId = body.referenceId || null;

  console.log(
    `${LOG_PREFIX} api.sign-changeset.request ${JSON.stringify({
      referenceId,
      offerId,
      shop,
      lineItems,
    })}`
  );
  markPostPurchaseRuntimeHit("apiSignChangeset", {
    referenceId,
    offerId,
    shop,
    lineItems,
  });

  if (!offerId || !shop || lineItems.length === 0) {
    console.log(
      `${LOG_PREFIX} api.sign-changeset.skip ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "missing-changeset-context",
      })}`
    );
    return cors(
      json(
        {
          error: "Missing changeset context",
          debug: {
            referenceId,
            offerId,
            shopDomain: shop,
            lineItems,
            reason: "missing-changeset-context",
          },
        },
        { status: 400 }
      )
    );
  }

  const session = await db.session.findUnique({
    where: { shop },
    select: { accessToken: true },
  });
  const accessToken = session?.accessToken;

  if (!accessToken) {
    console.log(
      `${LOG_PREFIX} api.sign-changeset.error ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "missing-offline-session",
      })}`
    );
    return cors(
      json(
        {
          error: `No offline session found for ${shop}`,
          debug: {
            referenceId,
            offerId,
            shopDomain: shop,
            lineItems,
            reason: "missing-offline-session",
          },
        },
        { status: 404 }
      )
    );
  }

  const result = await resolveActiveOffersForCheckout({
    accessToken,
    lineItems,
    shopDomain: shop,
    referenceId,
  });
  const selectedOffer = getSelectedOffer(result.offers, offerId);

  if (!selectedOffer?.changes?.length) {
    console.log(
      `${LOG_PREFIX} api.sign-changeset.error ${JSON.stringify({
        referenceId,
        offerId,
        shop,
        reason: "offer-not-found",
        matchedOfferIds: result.debug.matchedOfferIds,
      })}`
    );
    return cors(
      json(
        {
          error: "Offer not found",
          debug: {
            ...result.debug,
            offerId,
            reason: "offer-not-found",
          },
        },
        { status: 404 }
      )
    );
  }

  const payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: uuidv4(),
    iat: Math.floor(Date.now() / 1000),
    sub: body.referenceId,
    changes: selectedOffer.changes,
  };

  const token = jwt.sign(payload, process.env.SHOPIFY_API_SECRET);
  console.log(
    `${LOG_PREFIX} api.sign-changeset.result ${JSON.stringify({
      referenceId,
      offerId,
      shop,
      changesCount: selectedOffer.changes.length,
    })}`
  );
  return cors(json({ token }));
};
