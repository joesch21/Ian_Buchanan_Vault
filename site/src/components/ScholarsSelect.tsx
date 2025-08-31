import { useEffect, useState } from "react";
import ChipSelect, { type Option } from "@/components/ChipSelect";

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
};

export default function ScholarsSelect({ selected, onChange, placeholder="Search scholars…" }: Props) {
  const [opts, setOpts] = useState<Option[]>([]);
  useEffect(() => {
    (async () => {
      const list = await fetch("/data/deleuzian-scholars.json").then(r=>r.json()).catch(()=>[]);
      setOpts(list.map((x: any) => ({ value: x.id, label: x.name })));
    })();
  }, []);
  return (
    <ChipSelect
      label="Scholar filter"
      options={opts}
      selected={selected}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
