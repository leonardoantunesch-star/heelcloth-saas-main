import React from "react";
import { OrderTrackingView } from "@/components/tracking/order-tracking-view";

export default async function RastreioCodigoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const codigoDecodificado = decodeURIComponent(codigo);

  return <OrderTrackingView codigoInicial={codigoDecodificado} />;
}
