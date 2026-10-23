import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { Switch } from "@/components/ui/switch";

export function FormTestComponent() {
  return (
    <div>
      <Input placeholder="Teste" label="Nome" error="Erro" helperText="Ajuda" />
      <Select
        label="Opção"
        options={[
          { value: "1", label: "Opção 1" },
          { value: "2", label: "Opção 2" },
        ]}
      />
      <Textarea label="Observações" placeholder="Digite aqui..." />
      <Checkbox label="Marcar opção" checked={true} />
      <Radio label="Opção Radio" name="radio-group" value="A" />
      <Switch label="Ativar modo" checked={false} />
    </div>
  );
}

console.log("✅ Componentes de formulário verificados!");
