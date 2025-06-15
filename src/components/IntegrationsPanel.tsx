import React from "react";
import { Card, CardBody, Button, Input, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const IntegrationsPanel: React.FC = () => {
  const [apiKey, setApiKey] = React.useState("sk-1234567890abcdefghijklmnopqrstuvwxyz");
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle API key update
  const handleApiKeyUpdate = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "API key updated",
        description: "Your API key has been updated successfully",
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Update failed",
        description: "There was an error updating your API key. Please try again.",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="tabpanel"
      id="tabpanel-integrations"
      aria-labelledby="tab-integrations"
      className="space-y-6"
    >
      <Card className="shadow-soft overflow-hidden">
        <CardBody className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">API Key</h3>
              <div className="space-y-2">
                <Input
                  type="password"
                  label="Your API Key"
                  value={apiKey}
                  onValueChange={setApiKey}
                  className="rounded-full"
                  endContent={
                    <Button 
                      isIconOnly 
                      variant="light" 
                      size="sm"
                      onPress={() => {
                        navigator.clipboard.writeText(apiKey);
                        addToast({
                          title: "API key copied",
                          description: "API key has been copied to clipboard",
                          color: "success"
                        });
                      }}
                      className="rounded-full"
                      aria-label="Copy API key"
                    >
                      <Icon icon="lucide:copy" />
                    </Button>
                  }
                />
                <p className="text-xs text-gray-500">
                  Your API key provides access to the DecisionFindr API. Keep it secure and never share it publicly.
                </p>
              </div>
              <div className="mt-4">
                <Button 
                  variant="flat" 
                  color="primary"
                  onPress={handleApiKeyUpdate}
                  isLoading={isLoading}
                  className="rounded-full"
                >
                  Regenerate API Key
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connected Services</h3>
              <div className="space-y-4">
                <Card className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="logos:hubspot-icon" className="text-2xl" />
                      <div>
                        <h5 className="font-semibold">HubSpot</h5>
                        <p className="text-xs text-gray-500">Connected on Jun 15, 2023</p>
                      </div>
                    </div>
                    <Button 
                      variant="light" 
                      color="danger" 
                      size="sm" 
                      className="rounded-full"
                      aria-label="Disconnect HubSpot"
                    >
                      Disconnect
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="logos:salesforce" className="text-2xl" />
                      <div>
                        <h5 className="font-semibold">Salesforce</h5>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <Button 
                      variant="flat" 
                      color="primary" 
                      size="sm" 
                      className="rounded-full"
                      aria-label="Connect Salesforce"
                    >
                      Connect
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="logos:google-gmail" className="text-2xl" />
                      <div>
                        <h5 className="font-semibold">Gmail</h5>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <Button 
                      variant="flat" 
                      color="primary" 
                      size="sm" 
                      className="rounded-full"
                      aria-label="Connect Gmail"
                    >
                      Connect
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default IntegrationsPanel;