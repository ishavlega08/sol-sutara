import ParentsView from "./ParentsView";

export default function ParentsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { name?: string };
}) {
  return (
    <ParentsView
      id={params.id}
      componentName={searchParams.name ?? ""}
    />
  );
}
