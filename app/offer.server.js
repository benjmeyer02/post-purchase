import db from "./db.server";
import { apiVersion } from "./shopify.server";

const LOG_PREFIX = "[post-purchase]";

export function getShopDomainFromSessionToken(sessionToken) {
  const dest = sessionToken?.dest?.replace(/^https?:\/\//, "");
  const inputShop = sessionToken?.input_data?.shop?.domain;

  return (inputShop || dest || "").replace(/\/$/, "");
}

export function getInitialProductIdFromSessionToken(sessionToken) {
  return (
    sessionToken?.input_data?.initialPurchase?.lineItems?.[0]?.product?.id ||
    null
  );
}

export function getInitialVariantIdFromSessionToken(sessionToken) {
  return (
    sessionToken?.input_data?.initialPurchase?.lineItems?.[0]?.variant?.id ||
    null
  );
}

export function getInitialLineItemsFromSessionToken(sessionToken) {
  return (sessionToken?.input_data?.initialPurchase?.lineItems ?? []).map(
    (lineItem, index) => ({
      index,
      quantity: lineItem?.quantity ?? null,
      title: lineItem?.title || null,
      productId: normalizeProductId(lineItem?.product?.id),
      variantId: normalizeVariantId(lineItem?.variant?.id),
    })
  );
}

function normalizeProductId(productId) {
  if (!productId) return null;
  if (String(productId).startsWith("gid://shopify/Product/")) {
    return String(productId);
  }

  return `gid://shopify/Product/${productId}`;
}

function normalizeVariantId(variantId) {
  if (!variantId) return null;
  if (String(variantId).startsWith("gid://shopify/ProductVariant/")) {
    return String(variantId);
  }

  return `gid://shopify/ProductVariant/${variantId}`;
}

function buildDiscount(offer) {
  if (!offer.discountType || offer.discountValue == null) {
    return undefined;
  }

  const value =
    offer.discountType === "fixed_amount"
      ? Number(offer.discountValue).toFixed(2)
      : Number(offer.discountValue);

  return {
    value,
    valueType: offer.discountType,
    title:
      offer.discountType === "fixed_amount"
        ? `$${Number(offer.discountValue).toFixed(2)} off`
        : `${Number(offer.discountValue)}% off`,
  };
}

function logRuntime(event, payload) {
  try {
    console.log(`${LOG_PREFIX} ${event} ${JSON.stringify(payload)}`);
  } catch (error) {
    console.log(`${LOG_PREFIX} ${event}`, payload, error);
  }
}

function buildLineItemLookup(lineItems = []) {
  return lineItems.map((lineItem) => ({
    index: lineItem.index ?? null,
    quantity: lineItem.quantity ?? null,
    title: lineItem.title ?? null,
    productId: normalizeProductId(lineItem.productId),
    variantId: normalizeVariantId(lineItem.variantId),
  }));
}

function evaluateOfferMatch(offer, lineItems) {
  for (const lineItem of lineItems) {
    if (
      offer.triggerVariantId &&
      lineItem.variantId === offer.triggerVariantId
    ) {
      return {
        matched: true,
        reason: "matched-trigger-variant",
        matchedLineItem: lineItem,
      };
    }

    if (
      offer.triggerProductId &&
      lineItem.productId === offer.triggerProductId &&
      (!offer.triggerVariantId || lineItem.variantId === offer.triggerVariantId)
    ) {
      return {
        matched: true,
        reason: offer.triggerVariantId
          ? "matched-trigger-product-and-variant"
          : "matched-trigger-product",
        matchedLineItem: lineItem,
      };
    }
  }

  return {
    matched: false,
    reason: offer.triggerVariantId
      ? "no-line-item-matched-trigger-variant"
      : "no-line-item-matched-trigger-product",
    matchedLineItem: null,
  };
}

export async function resolveActiveOffersForCheckout({
  accessToken,
  lineItems,
  shopDomain,
  referenceId = null,
}) {
  const normalizedLineItems = buildLineItemLookup(lineItems);
  const debug = {
    referenceId,
    shopDomain,
    lineItems: normalizedLineItems,
    offerMatches: [],
    matchedOfferIds: [],
    reason: null,
  };

  if (!accessToken || !shopDomain) {
    debug.reason = "missing-access-token-or-shop";
    return { offers: [], debug };
  }

  if (
    !normalizedLineItems.some(
      (lineItem) => lineItem.productId || lineItem.variantId
    )
  ) {
    debug.reason = "missing-line-items";
    return { offers: [], debug };
  }

  const offers = await db.offer.findMany({
    where: {
      shop: shopDomain,
      isActive: true,
    },
    orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
  });

  debug.offerMatches = offers.map((offer) => {
    const match = evaluateOfferMatch(offer, normalizedLineItems);
    return {
      offerId: offer.id,
      triggerProductId: offer.triggerProductId,
      triggerVariantId: offer.triggerVariantId,
      reason: match.reason,
      matched: match.matched,
      matchedLineItem: match.matchedLineItem,
    };
  });

  const matchedOffers = offers.filter((offer) =>
    debug.offerMatches.some(
      (match) => match.offerId === offer.id && match.matched
    )
  );

  debug.matchedOfferIds = matchedOffers.map((offer) => offer.id);
  debug.reason =
    matchedOffers.length > 0
      ? "matched-active-offers"
      : "no-active-offers-matched";

  const hydratedOffers = await Promise.all(
    matchedOffers.map(async (offer) => {
      const variant = await getVariantDetails({
        accessToken,
        shopDomain,
        variantId: offer.offerVariantId,
      });

      if (!variant?.id || !variant?.product) {
        return null;
      }

      const variantID = String(variant.id).split("/").pop();
      const discount = buildDiscount(offer);

      return {
        id: offer.id,
        title: offer.headline,
        productTitle: variant.product.title,
        productImageURL:
          variant.product.featuredMedia?.preview?.image?.url || "",
        productDescription: offer.description
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
        originalPrice: variant.price,
        discountedPrice: variant.price,
        acceptLabel: offer.acceptLabel,
        declineLabel: offer.declineLabel || "Decline this offer",
        changes: [
          {
            type: "add_variant",
            variantID,
            quantity: 1,
            ...(discount ? { discount } : {}),
          },
        ],
      };
    })
  );

  return {
    offers: hydratedOffers.filter(Boolean),
    debug,
  };
}

export async function getOffers({
  accessToken,
  productId,
  variantId,
  shopDomain,
}) {
  const lineItems = [
    {
      productId,
      variantId,
      quantity: 1,
      title: null,
    },
  ];

  const result = await resolveActiveOffersForCheckout({
    accessToken,
    lineItems,
    shopDomain,
  });

  return result.offers;
}

async function getVariantDetails({ accessToken, shopDomain, variantId }) {
  const query = `#graphql
    query PostPurchaseVariant($variantId: ID!) {
      productVariant(id: $variantId) {
        product {
          description
          title
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
        }
        title
        price
        id
      }
    }
  `;

  const response = await fetchGraphQL({
    accessToken,
    query,
    shopDomain,
    variables: { variantId },
  });

  return response?.data?.productVariant || null;
}

async function fetchGraphQL({
  accessToken,
  query,
  shopDomain,
  variables = {},
}) {
  const response = await fetch(
    `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const payload = await response.json();

  if (!response.ok || payload?.errors?.length) {
    logRuntime("graphql-error", {
      shopDomain,
      status: response.status,
      variables,
      errors: payload?.errors || null,
    });
  }

  return payload;
}

export function getSelectedOffer(offers, offerId) {
  return offers.find((offer) => offer.id === offerId) || null;
}
