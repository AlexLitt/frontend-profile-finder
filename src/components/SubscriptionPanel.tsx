import React from "react";
import { Card, CardBody, Button, Spinner, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";

// Mock subscription plans
const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "10 searches per month",
      "Basic filters",
      "CSV export",
      "Email support"
    ],
    searchLimit: 10
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "per month",
    features: [
      "100 searches per month",
      "Advanced filters",
      "All export formats",
      "Basic CRM integrations",
      "Priority support"
    ],
    searchLimit: 100,
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "per month",
    features: [
      "500 searches per month",
      "All Pro features",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated account manager"
    ],
    searchLimit: 500
  }
];

const SubscriptionPanel: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(user?.subscription.plan.toLowerCase() || "free");

  // Handle subscription update
  const handleSubscriptionUpdate = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "Subscription updated",
        description: `Your subscription has been updated to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Update failed",
        description: "There was an error updating your subscription. Please try again.",
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
      id="tabpanel-subscription"
      aria-labelledby="tab-subscription"
      className="space-y-6"
    >
      <Card className="shadow-soft overflow-hidden">
        <CardBody className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{user?.subscription.plan}</span>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-gray-500">
                  {user?.subscription.searchesRemaining} searches remaining
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    isPressable
                    onPress={() => setSelectedPlan(plan.id)}
                    className={`border-2 ${selectedPlan === plan.id ? 'border-primary-500' : 'border-gray-200'}`}
                  >
                    <CardBody className="p-4">
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs px-2 py-1 rounded-bl-md">
                          Popular
                        </div>
                      )}
                      <div className="flex flex-col h-full">
                        <div>
                          <h4 className="font-bold">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-xl font-bold">{plan.price}</span>
                            <span className="text-sm text-gray-500">{plan.period}</span>
                          </div>
                        </div>
                        <ul className="text-sm space-y-2 mb-4 flex-1">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Icon icon="lucide:check" className="text-success text-sm" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
            
            <Button 
              color="primary" 
              onPress={handleSubscriptionUpdate}
              isLoading={isLoading}
              spinner={<Spinner size="sm" color="white" />}
              isDisabled={selectedPlan === user?.subscription.plan.toLowerCase()}
              className="w-full md:w-auto rounded-full"
            >
              Update Subscription
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default SubscriptionPanel;