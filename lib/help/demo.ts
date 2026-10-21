import { demoProfiles, producerOwnedBy, productsByProducer } from "@/lib/db/repo";

// Producto que usan las guías: uno del productor de demo, para que la muestra pedida
// en la guía del hostelero aparezca luego en el panel del productor.
export function demoProductId(): number {
  const owner = demoProfiles().find((p) => p.role === "productor");
  const producer = owner ? producerOwnedBy(owner.id) : undefined;
  return (producer && productsByProducer(producer.id)[0]?.id) || 1;
}
