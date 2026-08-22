import DrillNav from "@/components/DrillNav";
import DrillRunner from "@/components/DrillRunner";
export default function Page() {
  return (
    <>
      <div className="container" style={{ paddingTop: 28 }}>
        <DrillNav current="missing operand" />
      </div>
      <DrillRunner topic="missing-operand" />
    </>
  );
}
