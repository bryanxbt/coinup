import { redirect } from "next/navigation";

/** Tables list lives under game overview now. basePath applied by Next. */
export default function TablesRedirectPage() {
  redirect("/card-room/games/holdem-cash/?tab=overview");
}
