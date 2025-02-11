import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: { theme?: string };
}) {
  const ownerId = `temp_${Date.now()}`;
  const { theme } = await searchParams;
  const themeParam = theme === "light" ? "?theme=light" : "";
  redirect(`/${ownerId}/connectors/salesforce${themeParam}`);
}
