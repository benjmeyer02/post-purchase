const PRODUCTS_QUERY = `#graphql
  query AdminOfferProducts {
    products(first: 50, sortKey: TITLE) {
      edges {
        node {
          id
          title
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    }
  }
`;

export async function loadCatalog(admin) {
  const response = await admin.graphql(PRODUCTS_QUERY);
  const payload = await response.json();
  const productEdges = payload?.data?.products?.edges ?? [];

  const products = productEdges
    .map((edge) => edge?.node)
    .filter(Boolean)
    .map((product) => ({
      id: product.id,
      title: product.title,
      imageUrl: product.featuredMedia?.preview?.image?.url || "",
      variants: (product.variants?.edges ?? [])
        .map((edge) => edge?.node)
        .filter(Boolean)
        .map((variant) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          productId: product.id,
          productTitle: product.title,
          label:
            variant.title && variant.title !== "Default Title"
              ? `${product.title} - ${variant.title}`
              : product.title,
        })),
    }));

  const productOptions = products.map((product) => ({
    label: product.title,
    value: product.id,
  }));

  const variantOptions = products.flatMap((product) =>
    product.variants.map((variant) => ({
      label:
        variant.title && variant.title !== "Default Title"
          ? `${product.title} - ${variant.title} (${variant.price})`
          : `${product.title} (${variant.price})`,
      value: variant.id,
      productId: product.id,
      productTitle: product.title,
      variantTitle: variant.title,
    }))
  );

  const productMap = new Map(products.map((product) => [product.id, product]));
  const variantMap = new Map(variantOptions.map((variant) => [variant.value, variant]));

  return { products, productOptions, variantOptions, productMap, variantMap };
}
