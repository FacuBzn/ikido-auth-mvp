import type { Metadata } from "next";
import { ChildRewardsClient } from "./ChildRewardsClient";

export const metadata: Metadata = {
  title: "Rewards | iKidO",
};

export default function ChildRewardsPage() {
  return <ChildRewardsClient />;
}
