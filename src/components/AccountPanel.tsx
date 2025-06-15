import React from "react";
import { Card, CardBody, CardHeader, Input, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import ModernToggleSwitch from "./ModernToggleSwitch";

const AccountPanel: React.FC = () => {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [weeklyReports, setWeeklyReports] = React.useState(true);
  const [newFeatures, setNewFeatures] = React.useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="tabpanel"
      id="tabpanel-account"
      aria-labelledby="tab-account"
      className="space-y-6"
    >
      <Card className="shadow-soft overflow-hidden">
        <CardBody className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={user?.name || ""}
                  isReadOnly
                  className="rounded-full"
                />
                <Input
                  label="Email Address"
                  value={user?.email || ""}
                  isReadOnly
                  className="rounded-full"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
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
              </div>
              <div className="mt-4">
                <Button 
                  color="primary"
                  className="rounded-full"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone */}
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
              aria-label="Delete account"
            >
              Delete Account
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default AccountPanel;