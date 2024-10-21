import { Suspense } from "react";
import { getAmis, getRecommendedAmi } from "@/lib/server-actions";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  console.log("Rendering Home page (server-side)");

  // Fetch AMIs and recommended AMI server-side
  const [amis, recommendedAmi] = await Promise.all([
    getAmis(),
    getRecommendedAmi(),
  ]);

  // Optionally, fetch existing session data if stored in cookies (requires custom implementation)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient amis={amis.data} recommendedAmi={recommendedAmi.data} />
    </Suspense>
  );
}
