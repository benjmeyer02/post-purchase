const socketProbeResponse = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-Shopify-Dev-Proxy": "socket-probe-ack",
    },
  });

export const loader = async () => socketProbeResponse();

export const action = async () => socketProbeResponse();

export default function SocketRoute() {
  return null;
}
