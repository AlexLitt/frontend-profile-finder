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
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(
    profile?.subscription?.plan?.toLowerCase() || "free"
  );

  // Since we're bypassing auth for development, let's create a mock subscription
  const currentSubscription = profile?.subscription || { 
    plan: "free",
    searchesRemaining: 10,
    activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };

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
                <span className="text-xl font-bold">
                  {currentSubscription.plan}
                </span>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-gray-500">
                  {currentSubscription.searchesRemaining} searches remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    selectedPlan === plan.id ? "ring-2 ring-primary-500" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs px-2 py-1 rounded-bl">
                      Popular
                    </div>
                  )}
                  <CardBody className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold">{plan.name}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-gray-500">{plan.period}</span>
                        </div>
                      </div>
                      
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Icon
                              icon="lucide:check"
                              className="text-primary-500"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        color="primary"
                        size="lg"
                        className="w-full"
                        variant={selectedPlan === plan.id ? "solid" : "bordered"}
                        onPress={() => setSelectedPlan(plan.id)}
                      >
                        {selectedPlan === plan.id ? "Current Plan" : "Select Plan"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            <Button
              color="primary"
              size="lg"
              className="w-full md:w-auto"
              onPress={handleSubscriptionUpdate}
              isDisabled={selectedPlan === currentSubscription.plan.toLowerCase()}
              isLoading={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Updating...
                </>
              ) : (
                "Update Subscription"
              )}
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default SubscriptionPanel;