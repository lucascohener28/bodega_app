import { AdminCajaView } from "./AdminCajaView";
import { CajeroCajaView } from "./CajeroCajaView";

type Props = {
  rol: "ADMIN" | "CAJERO";
};

export function CajaDiariaView({ rol }: Props) {
  return rol === "ADMIN" ? <AdminCajaView /> : <CajeroCajaView />;
}
