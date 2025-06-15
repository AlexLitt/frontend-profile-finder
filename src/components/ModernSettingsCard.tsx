import React from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import ModernToggleSwitch from "./ModernToggleSwitch";

interface SettingsCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const ModernSettingsCard: React.FC<SettingsCardProps> = ({ title, icon, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-soft overflow-hidden">
        <CardHeader className="flex items-center gap-2 bg-gray-50 border-b border-gray-100">
          <Icon icon={icon} className="text-xl text-primary-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardHeader>
        <CardBody className="p-6">
          {children}
        </CardBody>
      </Card>
    </motion.div>
  );
};

// Danger Zone Card
export const DangerZoneCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-2 border-danger-200 shadow-none">
        <CardHeader className="flex items-center gap-2 bg-danger-50 border-b border-danger-200">
          <Icon icon="lucide:alert-triangle" className="text-xl text-danger" />
          <h3 className="text-lg font-semibold text-danger">Danger Zone</h3>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button 
              variant="bordered" 
              color="danger"
              startContent={<Icon icon="lucide:trash-2" />}
              className="border-2"
            >
              Delete Account
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

// Notification Settings
export const NotificationSettings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [weeklyReports, setWeeklyReports] = React.useState(true);
  const [newFeatures, setNewFeatures] = React.useState(true);
  
  return (
    <div className="space-y-4">
      <ModernToggleSwitch 
        label="Email Notifications"
        description="Receive notifications about your searches"
        isSelected={emailNotifications}
        onValueChange={setEmailNotifications}
      />
      
      <ModernToggleSwitch 
        label="Weekly Reports"
        description="Receive weekly usage reports"
        isSelected={weeklyReports}
        onValueChange={setWeeklyReports}
      />
      
      <ModernToggleSwitch 
        label="New Features"
        description="Get notified about new features and updates"
        isSelected={newFeatures}
        onValueChange={setNewFeatures}
      />
      
      <Button 
        color="primary"
        className="mt-4 rounded-full"
      >
        Save Preferences
      </Button>
    </div>
  );
};

export default ModernSettingsCard;