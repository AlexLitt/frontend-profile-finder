import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import SavedListsPanel from "../components/SavedListsPanel";

export default function ListsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Saved Lists</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <SavedListsPanel />
      </div>
    </div>
  );
}
