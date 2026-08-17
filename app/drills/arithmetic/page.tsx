import DrillNav from "@/components/DrillNav";
import DrillRunner from "@/components/DrillRunner";
export default function Page() {
  return (
    <>
      <div className="container" style={{ paddingTop: 28 }}>
        <DrillNav current="arithmetic" />
      </div>
      <DrillRunner topic="arithmetic" />
    </>
  );
}
