import React from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Drawer } from "@/components/ui/drawer";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function StructureTestComponent() {
  return (
    <div>
      <Modal isOpen={true} onClose={() => {}} title="Título Modal">
        Conteúdo
      </Modal>

      <ConfirmationDialog
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirmar"
        message="Tem certeza?"
      />

      <Drawer isOpen={true} onClose={() => {}} title="Gaveta">
        Conteúdo da gaveta
      </Drawer>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cabeçalho</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Dado</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Aba 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Conteúdo Aba 1</TabsContent>
      </Tabs>

      <Alert variant="info" title="Aviso">
        Mensagem de alerta
      </Alert>

      <EmptyState title="Vazio" description="Sem dados" />

      <Skeleton className="h-4 w-24" />
    </div>
  );
}

console.log("✅ Componentes estruturais verificados!");
