import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: "primary" | "success" | "warning" | "danger" | "default";
}

const ModernDashboardCard: React.FC<DashboardCardProps> = ({ 
  label, 
  value, 
  icon, 
  color = "primary" 
}) => {
  const colorClasses = {
    primary: "text-primary-500 bg-primary-50",
    success: "text-success-500 bg-success-50",
    warning: "text-warning-500 bg-warning-50",
    danger: "text-danger-500 bg-danger-50",
    default: "text-gray-500 bg-gray-50"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon icon={icon} className="text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-semibold mt-1">{value}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default ModernDashboardCard;