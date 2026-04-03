import { useEffect, useState } from "react";
import {
  extend,
  render,
  useExtensionInput,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Separator,
  Text,
  TextContainer,
  Tiles,
  TextBlock,
  Layout,
} from "@shopify/post-purchase-ui-extensions-react";
import { APP_URL } from "./app-url";

console.log("[post-purchase] extension configured", { appUrl: APP_URL });

extend(
  "Checkout::PostPurchase::ShouldRender",
  async ({ inputData, storage }) => {
    try {
      const offerUrl = `${APP_URL}/api/offer`;
      console.log("[post-purchase] ShouldRender entered", {
        appUrl: APP_URL,
        offerUrl,
        referenceId: inputData.initialPurchase.referenceId,
      });
      console.log("[post-purchase] ShouldRender fetching offer", {
        url: offerUrl,
      });

      const postPurchaseOffer = await fetch(offerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${inputData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceId: inputData.initialPurchase.referenceId,
        }),
      }).then((response) => response.json());

      console.log("[post-purchase] ShouldRender offer response", {
        render:
          Array.isArray(postPurchaseOffer?.offers) &&
          postPurchaseOffer.offers.length > 0,
        offerCount: postPurchaseOffer?.offers?.length ?? 0,
        debug: postPurchaseOffer?.debug,
      });

      await storage.update(postPurchaseOffer);

      return {
        render:
          Array.isArray(postPurchaseOffer?.offers) &&
          postPurchaseOffer.offers.length > 0,
      };
    } catch (error) {
      console.error("[post-purchase] ShouldRender failed", {
        appUrl: APP_URL,
        error,
      });
      return { render: false };
    }
  }
);

render("Checkout::PostPurchase::Render", () => <App />);

export function App() {
  const { storage, inputData, calculateChangeset, applyChangeset, done } =
    useExtensionInput();
  const [loading, setLoading] = useState(true);
  const [calculatedPurchase, setCalculatedPurchase] = useState();

  const offers = storage.initialData?.offers ?? [];

  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const purchaseOption = offers[currentOfferIndex];

  useEffect(() => {
    console.log("[post-purchase] Render entered", {
      referenceId: inputData.initialPurchase.referenceId,
      offerCount: offers.length,
      currentOfferId: purchaseOption?.id || null,
      debug: storage.initialData?.debug,
    });
  }, [
    inputData.initialPurchase.referenceId,
    offers.length,
    purchaseOption?.id,
    storage.initialData?.debug,
  ]);

  useEffect(() => {
    if (!purchaseOption) {
      done();
    }
  }, [done, purchaseOption]);

  useEffect(() => {
    if (!purchaseOption) return;

    async function calculatePurchase() {
      const result = await calculateChangeset({
        changes: purchaseOption.changes,
      });

      setCalculatedPurchase(result.calculatedPurchase);
      setLoading(false);
    }

    calculatePurchase();
  }, [calculateChangeset, purchaseOption?.changes]);

  if (!purchaseOption) {
    return null;
  }

  // Extract values from the calculated purchase.
  const shipping =
    calculatedPurchase?.addedShippingLines[0]?.priceSet?.presentmentMoney
      ?.amount;
  const taxes =
    calculatedPurchase?.addedTaxLines[0]?.priceSet?.presentmentMoney?.amount;
  const total =
    calculatedPurchase?.totalOutstandingSet?.presentmentMoney?.amount;
  const discountedPrice =
    calculatedPurchase?.updatedLineItems[0]?.totalPriceSet?.presentmentMoney
      .amount;
  const originalPrice =
    calculatedPurchase?.updatedLineItems[0]?.priceSet?.presentmentMoney?.amount;

  async function acceptOffer() {
    setLoading(true);
    const signChangesetUrl = `${APP_URL}/api/sign-changeset`;
    console.log("[post-purchase] acceptOffer requested", {
      referenceId: inputData.initialPurchase.referenceId,
      offerId: purchaseOption.id,
      signChangesetUrl,
    });
    console.log("[post-purchase] acceptOffer fetching token", {
      url: signChangesetUrl,
    });

    // Make a request to your app server to sign the changeset with your app's API secret key.
    const response = await fetch(signChangesetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referenceId: inputData.initialPurchase.referenceId,
        offerId: purchaseOption.id,
      }),
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error("[post-purchase] acceptOffer failed", {
          signChangesetUrl,
          error,
        });
        return null;
      });

    console.log("[post-purchase] sign-changeset response", response);
    const token = response?.token;

    if (!token) {
      setLoading(false);
      return;
    }

    await applyChangeset(token);
    done();
  }

  function declineOffer() {
    setLoading(true);

    if (currentOfferIndex < offers.length - 1) {
      setCurrentOfferIndex(currentOfferIndex + 1);
    } else {
      done();
    }
  }

  return (
    <BlockStack spacing="loose">
      <CalloutBanner>
        <BlockStack spacing="tight">
          <TextContainer>
            <Text size="medium" emphasized>
              {purchaseOption.title}
            </Text>
          </TextContainer>
          <TextContainer>
            <Text size="medium">
              Add {purchaseOption.productTitle} before your order is finalized.
            </Text>
          </TextContainer>
        </BlockStack>
      </CalloutBanner>
      <Layout
        media={[
          { viewportSize: "small", sizes: [1, 0, 1], maxInlineSize: 0.9 },
          { viewportSize: "medium", sizes: [532, 0, 1], maxInlineSize: 420 },
          { viewportSize: "large", sizes: [560, 38, 340] },
        ]}
      >
        <Image
          description="product photo"
          source={purchaseOption.productImageURL}
        />
        <BlockStack />
        <BlockStack>
          <Heading>{purchaseOption.productTitle}</Heading>
          <PriceHeader
            discountedPrice={discountedPrice}
            originalPrice={originalPrice}
            loading={!calculatedPurchase}
          />
          <ProductDescription textLines={purchaseOption.productDescription} />
          <BlockStack spacing="tight">
            <Separator />
            <MoneyLine
              label="Subtotal"
              amount={discountedPrice}
              loading={!calculatedPurchase}
            />
            <MoneyLine
              label="Shipping"
              amount={shipping}
              loading={!calculatedPurchase}
            />
            <MoneyLine
              label="Taxes"
              amount={taxes}
              loading={!calculatedPurchase}
            />
            <Separator />
            <MoneySummary label="Total" amount={total} />
          </BlockStack>
          <BlockStack>
            <Button onPress={acceptOffer} submit loading={loading}>
              {purchaseOption.acceptLabel || "Add to order"} ·{" "}
              {formatCurrency(total)}
            </Button>
            <Button onPress={declineOffer} subdued loading={loading}>
              {purchaseOption.declineLabel || "No thanks"}
            </Button>
          </BlockStack>
        </BlockStack>
      </Layout>
    </BlockStack>
  );
}

function PriceHeader({ discountedPrice, originalPrice, loading }) {
  return (
    <TextContainer alignment="leading" spacing="loose">
      <Text role="deletion" size="large">
        {!loading && formatCurrency(originalPrice)}
      </Text>
      <Text emphasized size="large" appearance="critical">
        {" "}
        {!loading && formatCurrency(discountedPrice)}
      </Text>
    </TextContainer>
  );
}

function ProductDescription({ textLines }) {
  return (
    <BlockStack spacing="xtight">
      {textLines.map((text, index) => (
        <TextBlock key={index} subdued>
          {text}
        </TextBlock>
      ))}
    </BlockStack>
  );
}

function MoneyLine({ label, amount, loading = false }) {
  return (
    <Tiles>
      <TextBlock size="small">{label}</TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="small">
          {loading ? "-" : formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function MoneySummary({ label, amount }) {
  return (
    <Tiles>
      <TextBlock size="medium" emphasized>
        {label}
      </TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="medium">
          {formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function formatCurrency(amount) {
  if (!amount || parseInt(amount, 10) === 0) {
    return "Free";
  }
  return `$${amount}`;
}
