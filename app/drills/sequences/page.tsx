import DrillNav from "@/components/DrillNav";
import DrillRunner from "@/components/DrillRunner";
export default function Page() {
  return (
    <>
      <DrillNav current="sequences" />
      <DrillRunner topic="sequences" />
    </>
  );
}
