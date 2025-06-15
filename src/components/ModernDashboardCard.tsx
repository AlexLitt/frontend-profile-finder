import React from "react";
import { Card, CardBody, Chip, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface SubscriptionData {
  plan: string;
  searchesRemaining: number;
  totalSearches: number;
  usagePercentage: number;
  expiresAt: string;
}

interface DashboardCardProps {
  userName: string;
  subscriptionData: SubscriptionData;
}

const ModernDashboardCard: React.FC<DashboardCardProps> = ({ userName, subscriptionData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-soft overflow-hidden">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Welcome back, {userName}!</h2>
              <p className="text-gray-600">
                Find the right decision-makers for your business with AI-powered precision.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold">{subscriptionData.plan} Plan</h4>
                <Chip 
                  color={subscriptionData.plan === "Free" ? "default" : "primary"} 
                  variant="flat" 
                  size="sm"
                >
                  {subscriptionData.plan === "Free" ? "Free" : "Active"}
                </Chip>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-500">Searches Used</p>
                    <p className="text-sm font-medium">
                      {subscriptionData.totalSearches - subscriptionData.searchesRemaining} / {subscriptionData.totalSearches}
                    </p>
                  </div>
                  <Progress 
                    value={subscriptionData.usagePercentage} 
                    color={subscriptionData.usagePercentage > 80 ? "warning" : "primary"}
                    className="h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Plan expires on {subscriptionData.expiresAt}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default ModernDashboardCard;