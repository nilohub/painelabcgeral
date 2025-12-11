import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import OfferUpload from "@/components/offers/OfferUpload";
import OfferDashboard from "@/components/offers/OfferDashboard";

const Offers = () => {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Ofertas</h1>
          <p className="text-muted-foreground">
            Gerencie suas promoções e analise o histórico de ofertas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upload">Upload de Ofertas</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <OfferUpload onUploadSuccess={() => setActiveTab("dashboard")} />
          </TabsContent>
          
          <TabsContent value="dashboard" className="mt-6">
            <OfferDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Offers;
